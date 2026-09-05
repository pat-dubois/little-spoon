/** Run unmodified WHO R routines to produce independent test expectations.
 * Requires webR 0.6.0 (test-generation only), installed outside the app.
 * WEBR_MODULE may point at its dist/webr.mjs. See docs/growth-validation.md.
 */
import { writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const { WebR } = await import(process.env.WEBR_MODULE || 'webr')
const r = new WebR()
await r.init()
const pin = 'b776d8a12b1c97369c748b561159fd2ec4f4db58'
const base = `https://raw.githubusercontent.com/WorldHealthOrganization/anthro/${pin}/`
const sourceFiles = ['anthro-package.R', 'utils.R', 'assertions.R', 'z-score-helper.R',
  'z-score-weight-for-age.R', 'z-score-length-for-age.R', 'z-score-bmi-for-age.R',
  'z-score-weight-for-lenhei.R', 'z-score-head-circumference-for-age.R',
  'z-score-arm-circumference-for-age.R', 'z-score-triceps-skinfold-for-age.R',
  'z-score-subscapular-skinfold-for-age.R', 'z-score.R']
const hashes = {}
for (const name of [...sourceFiles, 'sysdata.rda']) {
  const response = await fetch(`${base}R/${name}`)
  if (!response.ok) throw new Error(`WHO source download failed: ${name}: ${response.status}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  hashes[name] = createHash('sha256').update(bytes).digest('hex')
  await r.FS.writeFile(`/tmp/${name}`, bytes)
}
for (const name of sourceFiles) await r.evalRVoid(`source('/tmp/${name}')`)
await r.evalRVoid("load('/tmp/sysdata.rda')")

// Inputs cover both sexes, the age/measurement transition, daily neonatal ages,
// ordinary measurements, both extreme tails, and 0.1-cm table interpolation.
await r.evalRVoid(`
  inputs <- expand.grid(sex=c(1,2), age=c(0,1,7,30,90,123,274,300,365,548,730,731,732,987,1096,1522,1826), factor=c(.35,.65,.9,1,1.2,1.8,2.5))
  inputs$measure <- ifelse(inputs$age < 731, "l", "h")
  inputs$oedema <- "n"
  inputs$lenhei <- vapply(seq_len(nrow(inputs)), function(i) {
    subset(growthstandards_lenanthro, sex==inputs$sex[i] & age==inputs$age[i])$m * (.90 + (i %% 5)*.05)
  }, numeric(1))
  inputs$weight <- vapply(seq_len(nrow(inputs)), function(i) {
    subset(growthstandards_weianthro, sex==inputs$sex[i] & age==inputs$age[i])$m * inputs$factor[i]
  }, numeric(1))
  inputs$headc <- vapply(seq_len(nrow(inputs)), function(i) {
    subset(growthstandards_hcanthro, sex==inputs$sex[i] & age==inputs$age[i])$m * (.85 + (i %% 7)*.05)
  }, numeric(1))
  inputs$factor <- NULL
  bounds <- expand.grid(sex=c(1,2), age=c(100,1000), lenhei=c(44.9,45,45.05,55.55,64.9,65,65.05,77.86,109.95,110,110.1,119.95,120,120.1))
  bounds$measure <- ifelse(bounds$age<731,"l","h")
  bounds$oedema <- "n"; bounds$weight <- 10; bounds$headc <- 45
  adjusted <- data.frame(sex=c(1,2,1,2,1,2), age=c(300,730,731,987,1200,1800), measure=c("h","h","l","l","l","l"), oedema="n",lenhei=c(68,85,86,72.86,100,110),weight=c(8,12,12,10,15,17),headc=45)
  oedema <- data.frame(sex=c(1,2),age=c(100,1000),measure=c("l","h"),oedema="y",lenhei=c(60,90),weight=c(7,12),headc=c(40,48))
  inputs <- rbind(inputs,bounds[,names(inputs)],adjusted[,names(inputs)],oedema[,names(inputs)])
  result <- with(inputs,anthro_zscores(sex=sex,age=age,weight=weight,lenhei=lenhei,measure=measure,headc=headc,oedema=oedema))
`)
const columns = {}
for (const col of ['sex', 'age', 'weight', 'lenhei', 'measure', 'headc', 'oedema']) {
  columns[col] = await (await r.evalR(`inputs$${col}`)).toArray()
}
const expected = {}
for (const col of ['zwei', 'zlen', 'zbmi', 'zwfl', 'zhc', 'clenhei', 'cbmi', 'fwei', 'flen', 'fbmi', 'fwfl', 'fhc']) {
  expected[col] = await (await r.evalR(`result$${col}`)).toArray()
}
const metricColumns = { weightForAge: 'zwei', heightForAge: 'zlen', bmiForAge: 'zbmi', weightForLengthHeight: 'zwfl', headCircumferenceForAge: 'zhc' }
const fixtures = columns.age.map((ageDays, i) => ({
  input: { sex: columns.sex[i] === 1 ? 'male' : 'female', ageDays,
    weightKg: columns.weight[i], heightCm: columns.lenhei[i],
    measurementType: columns.measure[i] === 'l' ? 'length' : 'height',
    headCircumferenceCm: columns.headc[i], oedema: columns.oedema[i] === 'y' },
  expected: Object.fromEntries(Object.entries(metricColumns).map(([metric, col]) => [metric, expected[col][i]])),
  flags: Object.fromEntries(Object.entries(metricColumns).map(([metric, col]) => [metric, expected[`f${col.slice(1)}`][i]])),
  adjustedHeightCm: expected.clenhei[i], bmi: expected.cbmi[i],
}))
const version = await r.evalRString('R.version.string')
const dir = fileURLToPath(new URL('../src/clinical/data/growth/', import.meta.url))
await writeFile(`${dir}who-under5-fixtures.json`, JSON.stringify({
  provenance: { source: base, commit: pin, runtime: version, webR: '0.6.0', sourceHashes: hashes,
    method: 'Unmodified WHO anthro_zscores and official sysdata.rda, executed in R; expectations are not computed with application TypeScript.' }, fixtures,
}) + '\n')
console.log(`Generated ${fixtures.length} independent WHO under-five fixtures (${fixtures.length * 5} metric cases) with ${version}.`)
await r.close()

const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const url = 'http://localhost:8086'
const token = 'a84544ff9119033d67535ec9acf22d04246bfd946a0c3e330ecd22615129ffc4'
const org = 'smile_rnd'
const bucket = 'Nephele'

/**
 * Instantiate the InfluxDB client
 * with a configuration object.
 **/
const influxDB = new InfluxDB({ url, token })

/**
 * Create a write client from the getWriteApi method.
 * Provide your `org` and `bucket`.
 **/
const writeApi = influxDB.getWriteApi(org, bucket)

/**
 * Create a point and write it to the buffer.
 **/
const temp = new Point('Temperature')
    .tag('sensor_id', '3303')
    .floatField('5603', 0)
    .floatField('5700', 25)
    .floatField('5604', 70)
    .stringField('5701', '°C');

const hum = new Point('Humidity')
    .tag('sensor_id', '3304')
    .floatField('5603', 0)
    .floatField('5700', 25)
    .floatField('5604', 100)
    .stringField('5701', '%');

const perc = new Point('Percentage')
    .tag('sensor_id', '3320')
    .floatField('5603', 0)
    .floatField('5700', 50)

    .floatField('5604', 100)
    .stringField('5701', '%');

const press = new Point('Pressure')
    .tag('sensor_id', '3323')
    .floatField('5603', 0)
    .floatField('5700', 100)
    .floatField('5604', 250)
    .stringField('5701', 'Pa');

const concent = new Point('Concentration')
    .tag('sensor_id', '3325')
    .floatField('5603', 0)
    .floatField('5700', 99)
    .floatField('5604', 100)
    .stringField('5701', '%');

const acid = new Point('Acidity')
    .tag('sensor_id', '3326')
    .floatField('5603', 0)
    .floatField('5700', 2)
    .floatField('5604', 14)
    .stringField('5701', 'pH');

const plato = new Point('Plato degree sensor')
    .tag('sensor_id', '26243')
    .floatField('5603', 0)
    .floatField('5700', 50)
    .floatField('5604', 100)
    .stringField('5701', '°P');

writeApi.writePoint(temp)
writeApi.writePoint(perc)
writeApi.writePoint(hum)
writeApi.writePoint(press)
writeApi.writePoint(concent)
writeApi.writePoint(acid)
writeApi.writePoint(plato)

/**
 * Flush pending writes and close writeApi.
 **/
writeApi.close().then(() => {
    console.log('WRITE FINISHED')
})
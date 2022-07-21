const urlModel = require("../model/urlModel")
const shortId = require("shortid")
const redis = require("redis");
const { promisify } = require("util");


//Connect to redis
const redisClient = redis.createClient(
      14127,
      "redis-14127.c264.ap-south-1-1.ec2.cloud.redislabs.com",

      { no_ready_check: true }
);
redisClient.auth("hkOZb3DmJawEpVv6jrAwQYaACjKVJMXk", function (err) {
      if (err) throw err;
});

redisClient.on("connect", async function () {
      console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


//******************************************* createShortUrl **********************************/


const createShortUrl = async function (req, res) {
      try {
            const data = req.body
            const { longUrl } = data

            if (Object.keys(data).length == 0) {
                  return res.status(400).send({
                        status: false,
                        message: " Please Provide long Url "
                  })
            }
            //************ validate the longUrl */
            let regLongUrl = /^(http(s)?:\/\/)?(www.)?([a-zA-Z0-9])+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(:[0-9]{1,5})?(\/[^\s]*)?$/
            if (!regLongUrl.test(longUrl)) {
                  return res.status(400).send({
                        status: false,
                        message: " Please Provide a Valid long URL "
                  })
            }

            if (!longUrl) {
                  return res.status(400).send({
                        status: false,
                        message: "longUrl is mandatory"
                  })
            }

            //**************check LongUrl present or not already */
            const checkLongUrl = await urlModel.findOne({ longUrl }).select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 0 })
            if (checkLongUrl) {
                  return res.status(200).send({
                        status: true,
                        message: `this data geting from the redis`,
                        data: checkLongUrl
                  })
            }

            //*************generate the shorten Url */
            const shortCode = shortId.generate()
            const baseUrl = "http://localhost:3000";
            const shortUrl = baseUrl + "/" + shortCode;

            //*************create the shortUrl */
            await urlModel.create({ longUrl: longUrl, shortUrl: shortUrl, urlCode: shortCode })
            const saveData = await urlModel.findOne({ longUrl: longUrl }).select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 0 })

            //*************set the longUrl into the caching memory */
            await SET_ASYNC(`${data}`, JSON.stringify(saveData))
            return res.status(201).send({
                  status: true,
                  message: " Successfully Created Shorten Url ",
                  data: saveData
            })
      }
      catch (err) {
            return res.status(500).send({
                  status: false,
                  message: err.message
            })
      }
}


// ******************************************* getUrl **********************************/

const getUrl = async function (req, res) {
      try {
            const urlCode = req.params.urlCode

            //***********check urlCode valid or not */
            if (!(shortId.isValid(urlCode))) {
                  return res.status(400).send({
                        status: false,
                        message: "invaid url"
                  })
            }

            //***********get the urlCode from the cache memory */
            let cachedData = await GET_ASYNC(`${urlCode}`)
            //***********convert into text format */
            let stringCache = JSON.parse(cachedData)

            if (stringCache) {
                  return res.status(302).redirect(stringCache.longUrl) //*******redirect to given longUrl */
            }
            else {
                  let findUrl = await urlModel.findOne({ urlCode });
                  if (!findUrl) {
                        return res.status(404).send({
                              status: false,
                              message: "data not found"
                        })
                  }

                  //**********set the urlCode into the cache memory */
                  await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrl)) //**********convert into a JSON string */
                  return res.status(302).redirect(findUrl.longUrl)
            }

      } catch (err) {
            return res.status(500).send({
                  status: false,
                  message: err.message
            })
      }
}


module.exports.createShortUrl = createShortUrl
module.exports.getUrl = getUrl

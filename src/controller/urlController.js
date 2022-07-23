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
const SET_EX = promisify(redisClient.SETEX).bind(redisClient)


//******************************************* createShortUrl **********************************/


const createShortUrl = async function (req, res) {
      try {
            const data = req.body

            //*********** Body can't be empty */
            if (Object.keys(data).length == 0) {
                  return res.status(400).send({
                        status: false,
                        message: " Body can't be Empty "
                  })
            }
            //************ validate the longUrl */
            let regLongUrl = /^(http(s)?:\/\/)?(www.)?([a-zA-Z0-9])+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(:[0-9]{1,5})?(\/[^\s]*)?$/
            if (!regLongUrl.test(data.longUrl.trim())) {
                  return res.status(400).send({
                        status: false,
                        message: " Please Provide a Valid long URL "
                  })
            }

            //************ longUrl is required */
            if (!data.longUrl) {
                  return res.status(400).send({
                        status: false,
                        message: "longUrl is mandatory"
                  })
            }

            //*********check O/P is present or not in Cache Memory */
            let cacheUrl = await GET_ASYNC(`${data.longUrl}`) //******** it is into .json format */
            console.log(cacheUrl)
            let stringCache = JSON.parse(cacheUrl) //***********convert .json format into string format */
            console.log(stringCache)

            //********if desire o/p is present into cache memory then give sutable responce */
            if (stringCache) {
                  console.log("From cache memory")
                  return res.status(201).send({ 
                        status: true, 
                        message: "From Cache Memory",
                        data: stringCache 
                  })
            }
            //******** if it not present into the cache memory then it goes to the DB and find the desire o/p */
            else {
                  let dbData = await urlModel.findOne({ longUrl: data.longUrl })
                  //*********if desire o/p is present into the DB then return the that o/p and also set into the cache memory */
                  if (dbData) {
                        let dbData1 = {
                              urlCode: dbData.urlCode,
                              longUrl: dbData.longUrl,
                              shortUrl: dbData.shortUrl
                        }
                        console.log("coming from Db")
                        await SET_EX(`${data.longUrl}`, 20, JSON.stringify(dbData1)) //**********convert into a JSON string */
                        // await SET_ASYNC(`${data.longUrl}`, JSON.stringify(dbData1)) //**********convert into a JSON string */
                        return res.status(200).send({ 
                              status: true,
                              message: "Coming From DB", 
                              data: dbData1 
                        })
                  }

                  //******* else then create the short id into the DB and return the respose and also set the short id into cache memory */
                  const shortCode = shortId.generate().toLowerCase()
                  const baseUrl = "http://localhost:3000";
                  const shortUrl = baseUrl + "/" + shortCode.toLowerCase();
                  data.urlCode = shortCode
                  data.shortUrl = shortUrl

                  let result = await urlModel.create(data)
                  let res1 = {
                        urlCode: result.urlCode,
                        longUrl: result.longUrl,
                        shortUrl: result.shortUrl
                  }
                  console.log("successes created in db")
                  await SET_EX(`${data.longUrl}`, 20, JSON.stringify(res1)) //**********convert into a JSON string */
                  // await SET_ASYNC(`${data.longUrl}`, JSON.stringify(res1)) //**********convert into a JSON string */
                  return res.status(200).send({ 
                        status: true, 
                        message: "successes created in db",
                        data: res1 
                  })
            }
      }
      //****** if any error into the try block the remaining code will run stoped and jumped into catch block and give that error */
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

            //*********check shortUrl is present or not in Cache Memory */
            let cachedData = await GET_ASYNC(`${urlCode}`) //******** it is into .json format */
            let stringCache = JSON.parse(cachedData) //***********convert .json format into string format */

            if (stringCache) {
                  console.log("from cache memory")
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

                  console.log("from DB")
                  //**********set the urlCode into the cache memory */
                  await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrl)) //**********convert into a JSON string */
                  // await SET_EX(`${urlCode}`,20,JSON.stringify(findUrl))
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

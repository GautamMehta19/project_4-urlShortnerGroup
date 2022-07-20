const urlModel = require("../model/urlModel")
const shortId = require("shortid")
const mongoose = require("mongoose")
const redis = require("redis");
const { promisify } = require("util");


//Connect to redis
const redisClient = redis.createClient(
      10354,
      "redis-10354.c212.ap-south-1-1.ec2.cloud.redislabs.com",

      { no_ready_check: true }
);
redisClient.auth("vsfE1zHabXclFvHEvbntt3Ho5Ohn6VEd", function (err) {
      if (err) throw err;
});

redisClient.on("connect", async function () {
      console.log("Connected to Redis..");
});

//1. connect to the server
//2. use the commands :

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

            const shortCode = shortId.generate()
            const baseUrl = "http://localhost:3000";
            const shortUrl = baseUrl + "/" + shortCode;

            const checkLongUrl = await urlModel.findOne({ longUrl: longUrl }).select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 1 })
            if (checkLongUrl) {
                  return res.status(400).send({
                        status: false,
                        message: `longUrl is already present in the database`,
                        data: checkLongUrl
                  })
            }

            await urlModel.create({ longUrl: longUrl, shortUrl: shortUrl, urlCode: shortCode })
            const saveData = await urlModel.findOne({ longUrl: longUrl }).select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 1 })

            await SET_ASYNC(`${req.params.authorId}`, JSON.stringify(saveData))

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

            if (!(shortId.isValid(urlCode))) {
                  return res.status(400).send({
                        status: false,
                        message: "invaid url"
                  })
            }

            let checkUrl = await urlModel.findOne({ urlCode: urlCode })
            if (!checkUrl) {
                  return res.status(404).send({
                        status: false,
                        message: "data not found"
                  })
            }


            let cahcedProfileData = await GET_ASYNC(`${urlCode}`)
            if (cahcedProfileData) {
                  console.log(cahcedProfileData)
                  res.send(cahcedProfileData)
            } else {
                  let profile = await urlModel.findById(checkUrl);
                  await SET_ASYNC(`${checkUrl}`, JSON.stringify(profile))
                  return res.status(302).redirect(checkUrl.longUrl)
            }

            // return res.status(302).redirect(checkUrl.longUrl)

      } catch (err) {
            return res.status(500).send({
                  status: false,
                  message: err.message
            })
      }
}


module.exports.createShortUrl = createShortUrl
module.exports.getUrl = getUrl











// const createAuthor = async function (req, res) {
//       let data = req.body;
//       let authorCreated = await authorModel.create(data);
//       res.send({ data: authorCreated });
// };

// const fetchAuthorProfile = async function (req, res) {
//       let cahcedProfileData = await GET_ASYNC(`${req.params.authorId}`)
//       if (cahcedProfileData) {
//             res.send(cahcedProfileData)
//       } else {
//             let profile = await authorModel.findById(req.params.authorId);
//             await SET_ASYNC(`${req.params.authorId}`, JSON.stringify(profile))
//             res.send({ data: profile });
//       }

// };
// ``
// module.exports.createAuthor = createAuthor;
// module.exports.fetchAuthorProfile = fetchAuthorProfile;

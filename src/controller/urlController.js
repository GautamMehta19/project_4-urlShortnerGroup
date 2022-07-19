const urlModel = require("../model/urlModel")
const shortId = require("shortid")
const mongoose = require("mongoose")


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
            const saveData = await urlModel.findOne({longUrl:longUrl}).select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 1 })
            
            
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

            return res.status(302).redirect({
                  data:checkUrl.longUrl})

      } catch (err) {
            return res.status(500).send({
                  status: false,
                  message: err.message
            })
      }
}


module.exports.createShortUrl = createShortUrl
module.exports.getUrl = getUrl
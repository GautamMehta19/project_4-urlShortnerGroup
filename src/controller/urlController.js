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
                        message: " please enter the data in body "
                  })
            }

            let regLongUrl = /^(http(s)?:\/\/)?(www.)?([a-zA-Z0-9])+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(:[0-9]{1,5})?(\/[^\s]*)?$/
            if (!regLongUrl.test(longUrl)) {
                  return res.status(400).send({
                        status: false,
                        message: " please provide valid URL "
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

            const checkLongUrl = await urlModel.findOne({ longUrl: longUrl })
            if (checkLongUrl) {
                  return res.status(400).send({
                        status: false,
                        message: `longUrl is already present in the database`,
                        data: checkLongUrl
                        // data: `http://localhost:3000/${checkLongUrl.urlCode}`
                  })
            }

            const ShortenUrl = await urlModel.create({ longUrl: longUrl, shortUrl: shortUrl, urlCode: shortCode, });
            return res.status(201).send({
                  status: true,
                  message: " successfully created ",
                  data: ShortenUrl
            })
      }
      catch (err) {
            console.log(err.message)
            return res.status(500).send({
                  status: false,
                  message: err.message
            })
      }
}


//******************************************* getUrl **********************************/

const getUrl = async function (req, res) {
      try {
            const urlCode = req.params.urlCode
            console.log(urlCode)

            if (!(shortId.isValid(urlCode))) {
                  return res.status(404).send({
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

            return res.status(302).send({
                  status: true,
                  message: "successfull responce",
                  data: checkUrl.longUrl
            });

      } catch (err) {
            return res.status(500).send({
                  status: false,
                  message: err.message
            })
      }
}


module.exports.createShortUrl = createShortUrl
module.exports.getUrl = getUrl
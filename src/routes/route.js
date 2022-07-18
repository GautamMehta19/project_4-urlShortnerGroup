const express = require('express');
const router = express.Router()
const urlController=require('../controller/urlController')


//************ api for createShortUrl */
router.post('/url/shorten', urlController.createShortUrl)


//************ api for getUrl */
router.get('/:urlCode', urlController.getUrl)



//************ checking end point valid or not */
router.all("/**", function (req, res) {
    res.status(404).send({
        status: false,
        message: "Make Sure Your Endpoint is Correct or Not!"
    })
})

module.exports = router
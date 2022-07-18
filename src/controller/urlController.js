const { object } = require("webidl-conversions");
const urlModel = require("../models/urlModel")



const createShortUrl= async  function(){
      try {
            const data = req.body.longUrl
            const { longUrl } = data

            if(object.keys(data).length ==0){
                  return res.status(400).send({
                        status: false,
                        message : " please enter the data in body "
                  })
            }

            if(!longUrl){
                  return res.status(400).send({
                        status: false,
                        message:"longUrl is mandatory"
                  })
            }

            const findUrl = await urlModel.findOne({longUrl:longUrl})
            if(findUrl){
                  return res.status(400).send({
                        status: false,
                        message:"longUrl is already present in the database"
                  })
            }

            const saveUrl = await urlModel.create(data)
            return res.status(201).send({
                  status:true,
                  message: " successfully created ",
                  data: saveUrl
            })

      } catch (error) {
            return res.status(500).send({msg:"Server Error",Error:error})
      }
}


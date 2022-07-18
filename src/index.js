const express = require('express');
const bodyParser = require('body-parser');
const route = require('./routes/route.js');
const { default: mongoose } = require('mongoose');

const app = express();

app.use(bodyParser.json());


mongoose.connect("mongodb+srv://Dharmendra:dkyadav123@cluster0.kq9bu.mongodb.net/group44Database", {
    useNewUrlParser: true
})
    .then(() => console.log("Hello Group 44 MongoDb is connected"))
    .catch(err => console.log(err))

app.use('/', route);
app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running 🏃 on port ' + (process.env.PORT || 3000))
});

const mongoose = require('mongoose')

const numberSchema = new mongoose.Schema ({
    name: String,
    phoneNumber: String
})

numberSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})


module.exports= mongoose.model('PhonebookEntry', numberSchema)
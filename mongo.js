const mongoose = require ('mongoose')

if (process.argv.length < 3) {
    console.log('expected password as argument')
    process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://fullstack-open:${password}@atlascluster.29hbwpq.mongodb.net/Phonebook?retryWrites=true&w=majority`

mongoose.set('strictQuery', false)
mongoose.connect(url)

const phonebookSchema = new mongoose.Schema({
    name: String,
    phoneNumber: {},
})

const PhonebookEntry = mongoose.model('PhonebookEntry', phonebookSchema)

if (process.argv.length === 3) {
    PhonebookEntry.find({}).then(result => {
        result.forEach(entry => {
            console.log(entry)
        })
        mongoose.connection.close()
    })
}

if (process.argv.length === 5) {
    const newEntry = new PhonebookEntry({
        name: process.argv[3],
        phoneNumber: process.argv[4]
    })
    
    newEntry.save().then(result => {
        console.log('note saved!')
        mongoose.connection.close()
    })
}

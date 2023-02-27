const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const needle = require('needle')
const mongoose = require('mongoose')

const Note = require('./models/note')
const PhoneBook = require('./models/phonebook')
require('dotenv').config()


const app = express()

const key = process.env.open_weather_key
const db_url = process.env.mongo_databse_url

mongoose.set('strictQuery', false)
mongoose.connect(db_url)
const db = mongoose.connection
db.on('error', () => console.log('connection unsuccessful'))
db.once('open', () => console.log('connected'))

let persons = [
    { 
      "id": 1,
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": 2,
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": 3,
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": 4,
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
]


const requestLogger = (request, response, next) => {
    console.log('Method:', request.method)
    console.log('Path:', request.path)
    console.log('Body:', request.body)
    next()
}

const unknownEndpoint = (request, response) => {
    response.status(404).send({error: 'unknown endpoint'})
}

morgan.token('post-content', function(request, response) {return JSON.stringify(request.body)})

app.use(express.json())
app.use(express.static('build'))
app.use(cors())
app.use(morgan(':method :url :status :res[content-length] :response-time ms :post-content'))
app.use(requestLogger)

app.get('/', (request, response) => {
    response.send('<h1>welcome to the fullstack-open website</h1>')
})

app.get('/info', (request, response) => {
    requestDate = new Date()
    response.send(
        `<h1>Phonebook has info for ${persons.length} people</h1>
        <h2>${requestDate}</h2>`
        )
    })
    
app.get('/api/persons', (request, response) => {
    PhoneBook.find({})
        .then(result => response.json(result))
})


app.get('/api/persons/:id', (request, response) => {
    const requestID = request.params.id
    PhoneBook.findById(requestID, function(err, docs) {
        if (!docs) {
            return response.status(404).json({
                error: 'Entry not found.'
            })
        }
        response.status(200).json(docs)
    })
})

app.delete('/api/persons/:id', (request, response) => {
    const requestID = request.params.id
    PhoneBook.findByIdAndDelete(requestID, function(err, doc) {
        if (!doc) {
            return response.status(404).json({error: 'Object with ID not found. Unable to delete.'})
        }
        response.statusMessage = `Entry with id ${requestID} was deleted.`
        response.status(204).end()
    })
})

app.post('/api/persons', (request, response) => {
    if (request.body.name && request.body.number) {
        PhoneBook.find({ name: request.body.name }, function (err, docs){
            if (docs.length > 0) {
                return response.status(500).send({
                    error: "POST request made to already existing resource. Client side data not current"
                })
            } else {
                phoneBookEntry = new PhoneBook({
                    name: request.body.name,
                    phoneNumber: request.body.number
                })
                phoneBookEntry.save()
                    .then(savednumber => {
                        response.statusMessage = `Entry for ${request.body.name} was created in the phonebook`
                        return response.status(200).json(savednumber)
                    })
            }
        })
    }
    else {
        response.status(400).json({
            error: 'Name or Number cannot be blank'
        })
    }
})

app.put('/api/persons/:id', (request, response) => {
    updatedEntry = {
        phoneNumber: request.body.number
    }
    PhoneBook.findByIdAndUpdate({ _id: request.params.id }, updatedEntry, {returnDocument:'after'}, (err, docs) => {
        if (!docs) {
            return response.status(404).json({error: 'Entry not found. Unable to update.'})
        }
        response.status(200).json(docs)
    })
})

app.get('/api/notes', (request, response) => {
    Note.find({})
        .then(notes => {
            response.json(notes)
        })
})

app.get('/api/notes/:id', (request, response) => {
    const id = request.params.id
    Note.findById(id)
        .then(note => response.json(note))
})

app.post('/api/notes', (request, response) => {
    if (!request.body.content) {
        return response.status(400).json({
            error: 'content missing'
        })
    }
    
    const note = new Note ({
        content: request.body.content,
        important: request.body.important || false,
        date: new Date(),
    })

    note.save()
        .then(savedNote => response.json(savedNote))    
})

app.delete('/api/notes/:id', (request, response) => {
    const id = request.params.id
    Note.findByIdAndDelete(id)
        .then(response.status(204).end())
})

app.get('/api/countries/:latitude&:longitude', (request, response) => {
    needle('get', `https://api.openweathermap.org/data/2.5/forecast?lat=${request.params.latitude}&lon=${request.params.longitude}&cnt=2&appid=${key}`)
        .then(weather_data => {
            response.json(weather_data.body).end()
        })
})

app.use(unknownEndpoint)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
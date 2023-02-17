const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const needle = require('needle')
const app = express()
require('dotenv').config()

const key = process.env.open_weather_key

let notes = [
    {
      "id": 1,
      "content": "HTML is easy",
      "date": "2019-05-30T17:30:31.098Z",
      "important": true
    },
    {
      "id": 2,
      "content": "Browser can execute only JavaScript",
      "date": "2019-05-30T18:39:34.091Z",
      "important": true
    },
    {
      "id": 3,
      "content": "GET and POST are the most important methods of HTTP protocol",
      "date": "2019-05-30T19:20:14.298Z",
      "important": true
    }
]

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
    response.json(persons)
})


app.get('/api/persons/:id', (request, response) => {
    const requestID = Number(request.params.id)
    const person = persons.find(person => person.id === requestID)
    if (person) {
        response.json(person)
    } else {
        response.statusMessage= 'Entry not found'
        response.status(404).end()
    }
})

app.delete('/api/persons/:id', (request, response) => {
    const requestID = Number(request.params.id)
    persons = persons.filter(person => person.id !== requestID)
    response.statusMessage = `Entry with id ${requestID} was deleted`
    response.status(204).end()
})

app.post('/api/persons', (request, response) => {
    if (request.body.name && request.body.number) {
        if (persons.map(p => p.name).includes(request.body.name)){
            return response.status(400).json({
                "error": "Name on server must be unique"
            })
        }
        existingIDs = persons.map(p => p.id)
        newID = Math.floor(Math.random() * 1001)
        while (existingIDs.includes(newID)) {
            newID = Math.floor(Math.random() * 1001)
        }
        newEntryObject = {
            "id": newID,
            "name": request.body.name,
            "number": request.body.number
        }
        persons = persons.concat(newEntryObject)
        response.statusMessage = `Entry for ${request.body.name} was created in the phonebook`
        return response.status(200).json(newEntryObject)
    }
    else {
        response.status(400).json({
            error: 'Name or Number cannot be blank'
        })
    }
})

app.get('/api/notes', (request, response) => {
    response.json(notes)
})

app.get('/api/notes/:id', (request, response) => {
    const id = Number(request.params.id)
    const note = notes.find(note => {
        return note.id === id
    })
    if (note) {
        response.json(note)
    }
    else {
        response.statusMessage = 'Resource does not exist'
        response.status(404).end()
    }
})

app.post('/api/notes', (request, response) => {
    if (!request.body.content) {
        return response.status(404).json({
            error: 'content missing'
        })
    }
    
    existingIDs = notes.map(note => note.id)
    let max_notes = 1000
    
    if (existingIDs.length === max_notes) {
        return response.status(507).json({
            error: 'note server memory full. delete notes to continue'
        })
    }
    
    const generateID = () => {
        do {
            id = Math.floor(Math.random() * max_notes)
        }
        while (existingIDs.includes(id))
        return id
    }
    
    const note = {
        content: request.body.content,
        important: request.body.important || false,
        date: new Date(),
        id: generateID(),
    }
    
    notes = notes.concat(note)
    response.json(note)
})

app.delete('/api/notes/:id', (request, response) => {
    const id = Number(request.params.id)
    notes = notes.filter(note => note.id !== id)
    response.status(204).end()
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

// `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&cnt=2&appid=${API_KEY}`
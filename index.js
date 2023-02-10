const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const app = express()

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
    console.log('----')
    next()
}

const unknownEndpoint = (request, response) => {
    response.status(404).send({error: 'unknown endpoint'})
}

morgan.token('post-content', function(request, response) {return JSON.stringify(request.body)})

app.use(express.json())
app.use(cors())
app.use(morgan(':method :url :status :res[content-length] :response-time ms :post-content'))
app.use(requestLogger)

app.get('/', (request, response) => {
    response.send('<h1>welcome to the phonebook</h1>')
})

app.get('/info', (request, response) => {
    requestDate = new Date()
    response.send(
        `<h1>Phonebook has info for ${persons.length} people</h1>
        <h2>${requestDate}</h2>`
        )
    })
    
app.get('/api/persons', (request, response) => {
    console.log('sending response')
    response.json(persons)
})

app.get('/api/persons/:id', (request, response) => {
    const requestID = Number(request.params.id)
    const person = persons.find(person => person.id === requestID)
    console.log(person)
    if (person) {
        response.json(person)
    } else {
        response.statusMessage= 'Entry not found'
        response.status(404).end()
    }
})

app.delete('/api/persons/:id', (request, response) => {
    const requestID = Number(request.params.id)
    console.log(request.params.id)
    persons = persons.filter(person => person.id !== requestID)
    response.statusMessage = `Entry with id ${requestID} was deleted`
    response.status(204).end()
})
app.post('/api/persons', (request, response) => {
    if (request.body.name && request.body.number) {
        if (persons.map(p => p.name).includes(request.body.name)){
            return response.status(400).json({
                "error": "Name must be unique"
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
        return response.status(200).end()
    }
    else {
        response.status(400).json({
            error: 'Name or Number cannot be blank'
        })
    }
})

app.use(unknownEndpoint)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
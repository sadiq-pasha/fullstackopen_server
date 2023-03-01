const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const needle = require('needle')
const mongoose = require('mongoose')

const Note = require('./models/note')
const PhoneBook = require('./models/phonebook')
require('dotenv').config()


const app = express()

// eslint-disable-next-line no-undef
const key = process.env.open_weather_key
// eslint-disable-next-line no-undef
const db_url = process.env.mongo_databse_url

mongoose.set('strictQuery', false)
mongoose.connect(db_url)
const db = mongoose.connection
db.on('error', () => console.log('connection unsuccessful'))
db.once('open', () => console.log('connected'))

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:', request.path)
  console.log('Body:', request.body)
  next()
}

const errorHandler = (error, request, response, next) => {
  console.error(error)
  if (error.name === 'CastError') {
    return response.status(400).send({
      error: 'malformatted ID',
      raw_message: error.message
    })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
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
  console.log('here')
  const requestDate = new Date()
  PhoneBook.countDocuments({})
    .then(count => {
      response.send(
        `<h1>Phonebook has info for ${count} people</h1>
                <h2>${requestDate}</h2>`
      )
    })
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
      return response.status(404).json({ error: 'Object with ID not found. Unable to delete.' })
    }
    response.statusMessage = `Entry with id ${requestID} was deleted.`
    response.status(204).end()
  })
})

app.post('/api/persons', (request, response, next) => {
  const validationTester = (name, inputNumber) => {
    console.log(name, inputNumber)
    inputNumber = inputNumber.trim().split('-')
    // name must be between 3 and 50 characters long
    if (name.length < 3 || name.length > 50) return false
    // number cannot have more than one '-'
    if (inputNumber.length > 2) return false
    // number must be of length 8 or more
    if (inputNumber.reduce((acc, value) => acc + value.length , 0) < 8) return false
    // if number has two parts, the first part must be between 2 and 3 digits long
    if ((inputNumber.length > 1) && (inputNumber[0].length < 2 || inputNumber[0].length > 3)) return false
    // only numbers allowed in the string
    if (inputNumber.every((part) => {
      return /^\d+$/.test(part)
    }))
      return true
  }
  if (request.body.name && request.body.phoneNumber && validationTester(request.body.name, request.body.phoneNumber)) {
    console.log('validation complete')
    next()
  } else {
    response.status(400).send({
      error: 'Bad request. One or more mandatory fields missing or malformed'
    })
  }
}, (request, response) => {
  PhoneBook.find({ name: request.body.name }, function (err, docs){
    if (docs.length > 0) {
      return response.status(500).send({
        error: 'POST request made to already existing resource. Client side data not current'
      })
    } else {
      const phoneBookEntry = new PhoneBook({
        name: request.body.name,
        phoneNumber: request.body.phoneNumber
      })
      phoneBookEntry.save()
        .then(savednumber => {
          response.statusMessage = `Entry for ${request.body.name} was created in the phonebook`
          return response.status(200).json(savednumber)
        })
    }
  })
}
)

app.put('/api/persons/:id', (request, response) => {
  const updatedEntry = {
    phoneNumber: request.body.phoneNumber
  }
  PhoneBook.findByIdAndUpdate({ _id: request.params.id }, updatedEntry, { returnDocument:'after' }, (err, docs) => {
    if (!docs) {
      return response.status(404).json({ error: 'Entry not found. Unable to update.' })
    }
    response.status(200).json(docs)
  })
})

app.get('/api/notes', (request, response, next) => {
  Note.find({})
    .then(notes => {
      if (notes) {
        response.json(notes)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.get('/api/notes/:id', (request, response, next) => {
  const id = request.params.id
  Note.findById(id)
    .then(note => {
      if (note) {
        response.json(note)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.post('/api/notes', (request, response, next) => {
  const note = new Note ({
    content: request.body.content,
    important: request.body.important || false,
  })

  note.save()
    .then(savedNote => response.json(savedNote))
    .catch(error => next(error))
})

app.put('/api/notes/:id', (request, response, next) => {
  const updatedNote = {
    content: request.body.content,
    important: request.body.important
  }

  Note.findByIdAndUpdate(request.params.id, updatedNote, { returnDocument: 'after' })
    .then(newNote => {
      if (newNote) {
        response.json(newNote)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/notes', (request, response, next) => {
  Note.deleteMany({})
    .then(deleteCount => {
      console.log(deleteCount)
      Note.countDocuments({})
        .then(count => {
          if (count === 0){
            return response.status(200).json({
              deleteCount: deleteCount.deletedCount
            })
          }
        })
        .catch(error => {
          return response.status(500).json({
            error: `only ${deleteCount.deletedCount} message(s) were deleted`
          })
        })
    })
    .catch(error => next(error))
})

app.delete('/api/notes/:id', (request, response, next) => {
  const id = request.params.id
  Note.findByIdAndDelete(id)
    .then(docs => {
      if (!docs) {
        return response.status(404).json({
          error: 'resource with that ID was not found in the database'
        })
      }
      response.status(200).end()
    })
    .catch(error => next(error))
})


app.get('/api/countries/:latitude&:longitude', (request, response) => {
  needle('get', `https://api.openweathermap.org/data/2.5/forecast?lat=${request.params.latitude}&lon=${request.params.longitude}&cnt=2&appid=${key}`)
    .then(weather_data => {
      response.json(weather_data.body).end()
    })
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
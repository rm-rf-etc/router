
const Router = require('./index.js')

const request = {
	url: '/1/2',
	end: (body) => console.log(body),
}
const response = {}

const router = new Router()

router.addRoute('/1', (request, response) => {
	console.log(`url: ${request.url}, hi from 1`)
})
router.addRoute('/1/2', (request, response) => {
	console.log(`url: ${request.url}, hi 2`)
})

const controller = router.requestHandler(request, response)

controller()

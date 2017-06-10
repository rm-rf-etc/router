
const typeOf = require('typeof').typeOf

module.exports = class Router {

	constructor () {
		this.routeTree = {}
		this.pages = {
			'404': (request, response) => request.end('404 Page Not Found'),
			'500': (request, response) => request.end('500 Internal Server Error'),
		}
		this.expressions = {
			'{int}': /([1-9][0-9]*)/,
			'{any}': /([^/]*)/,
			'{a-z}': /([a-zA-Z]+)/,
			'{num}': /([0-9]+)/,
		}
	}

	addRoute (route, handler) {

		if (typeOf(route) !== 'String') {
			console.error(`Invalid route: ${route}`)
			return
		}

		// 1) remove leading and trailing slashes
		// 2) separate on each slash
		// 3) append a leaf node: '$'
		route = route.replace(/(^\/|\/$)/g,'').split('/').concat('$')

		// Now include the new route in our routes map object.
		treeMerge( this.routeTree, newBranch(route, handler) )

		return this.addRoute
	}

	requestHandler (request, response) {

		const self = this
		const { url } = request

		// Convert route into array of URL segments, ending with "$", the leaf node.
		const leafNode = url.slice(1)
			.replace(/\/$/g,'')
			.split('?')[0]
			.split('/')
			.concat('$')
			.reduce(climbTree, self.routeTree)

		return (leafNode && typeOf(leafNode) === 'Function')
			? () => leafNode(request, response)
			: () => self.pages[404](request, response) || null
	}
}


function hasRegex (segment) {

	return /^\{.+\}$/g.test(segment)
}


// Simple structure creates a route segment that *doesn't* have regex.
function simpleStructure (segment, children) {

	return {
		[segment]: children
	}
}


// Complex structure creates a route segment that *does* have regex.
function complexStructure (segment, children) {

	if (!this.expressions[segment]) throw new Error(`Unknown expression: ${segment.toString()}`)

	const regex = this.expressions[segment]

	return {
		'<regex>': {
			patterns: [regex],
			[regex.toString()]: children,
		}
	}
}


function climbTree (tree, segment) {

	return (!tree) ? null : tree[segment] || (() => {

		const regExpressions = tree['<regex>'] || undefined

		if (regExpressions) {

			for (var i=0; i < regExpressions.patterns.length; i++) {

				if (regExpressions.patterns[i].test(segment)) {

					args[n++] = segment // Increments n after the value is used for the assignment.
					const matchingPattern = regExpressions.patterns[i].toString()
					const nextSegment = regExpressions[matchingPattern]

					return nextSegment
				}
			}
		}
    })()
}


// Takes route path as array, returns route as nested objects.
function newBranch (routeAsArray, func) {

	return routeAsArray.reverse().reduce((children, segment) => {

		return (
			hasRegex(segment) ? complexStructure : simpleStructure
		)(segment, children)

	}, func)
}


// Merge a branch in a tree.
// { this: { is: { a: { branch: function(){} } } } }
// { trees: { have: { branches: { one: { a: 1 }, two: { a: 2 }, three: { a: 3 } } } } }
function treeMerge (tree, branch) {

	const self = this

	return Object.keys(branch).map(prop => {

		switch (true) {

			case prop === '<regex>':
				if (tree.hasOwnProperty(prop)) {
					branch[prop].patterns.map(regex => {
						if (hasMatchingRegex(tree[prop].patterns, regex)) tree[prop].patterns.push(regex)
					})
				}
				else tree[prop] = branch[prop]
				break

			case tree.hasOwnProperty(prop):
				treeMerge(tree[prop], branch[prop])
				break

			default:
				tree[prop] = branch[prop]

		}
	})

}

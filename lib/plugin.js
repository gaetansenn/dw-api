import Api from '~/dewib/api'

function injectContext (api, ctx, result) {
  Object.keys(api).forEach((key) => {
    if (typeof api[key] === 'object') {
      result[key] = {}
      injectContext(api[key], ctx, result[key])
    } else result[key] = new api[key](ctx)
  })
}

export default (ctx, inject) => {
  const api = {}

  injectContext(Api, ctx, api)

  ctx.$api = api
  inject('api', api)
}

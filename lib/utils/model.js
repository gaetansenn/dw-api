import { isObject, camelCase, isEmpty, isString, get } from 'lodash'

/**
 * extract data from data API response according to fields model
 *
 * @export
 * @
 * @class Model
 */
export default class Model {
  constructor (ctx) {
    this.$axios = ctx.$axios
    this.$store = ctx.store

    // Inject i18n if present
    if (ctx.app.i18n) {
      this.$i18n = ctx.app.i18n
      this.$t = ctx.app.i18n.t.bind(ctx.app.i18n)
      this.$tc = ctx.app.i18n.tc.bind(ctx.app.i18n)
    }

    // Inject global ctx
    this.ctx = ctx
  }

  get (url, { fields, queryParams, multi, headers, scope } = {}) {
    return this.handleRequest({
      method: 'get',
      url,
      fields,
      headers,
      queryParams,
      multi,
      scope
    })
  }

  post (url, body, { fields, queryParams, multi, headers, scope } = {}) {
    return this.handleRequest({
      method: 'post',
      body,
      url,
      fields,
      headers,
      queryParams,
      multi,
      scope
    })
  }

  delete (url, { fields, queryParams, multi, headers, scope } = {}) {
    return this.handleRequest({
      method: 'delete',
      url,
      fields,
      headers,
      queryParams,
      multi,
      scope
    })
  }

  patch (url, body, { fields, queryParams, multi, headers, scope } = {}) {
    return this.handleRequest({
      method: 'patch',
      body,
      url,
      fields,
      headers,
      queryParams,
      multi,
      scope
    })
  }

  handleRequest ({ method, url, body = {}, fields = [], multi = false, queryParams = {}, headers = {}, catchError = true, scope }) {
    return this.$axios({
      method,
      url,
      headers,
      params: queryParams,
      data: body
    }).then((response) => {
      // Inject scope
      response.data = scope ? get(response.data, scope) : response.data

      if (!multi) {
        if (!fields.length) return catchError ? [false, response.data] : response.data

        const mapped = this.extractModel(fields, response.data)

        return catchError ? [false, mapped] : mapped
      }

      response.data = response.data.map(this.extractModel.bind(this, fields))

      return (multi) ? (catchError ? [false, response.data] : response.data) : (catchError ? [false, response] : response)
    }).catch((err) => {
      if (catchError) return [err]
      else throw err
    })
  }

  /**
   *
   *
   * @param {*} fields
   * @param {*} model
   * @returns {*} Populated model with fields
   */
  extractModel (fields, model, parentModel, originModel) {
    if (isEmpty(model)) return null

    // Inject origin model
    if (!originModel) originModel = model

    const newModel = {}

    fields.forEach((field) => {
      // We normalize to camelCase
      const normalizedKey = camelCase(isObject(field) ? field.newKey || field.key : field)

      // Check for empty value
      if (isObject(field)) {
        if (model === null || isEmpty(model) || model[field.key] === null) {
          if (!field.default) return

          newModel[normalizedKey] = field.default
          return newModel[normalizedKey]
        }
      } else if (model === null || isEmpty(model) || model[field] === null) return

      // Return value if only key access
      if ((isObject(field) && (!field.mapping && !field.fields)) || !isObject(field)) {
        newModel[normalizedKey] = model[isObject(field) ? field.key : field]
        return newModel[normalizedKey]
      }

      // Mapping method should always return a value (`return` will break the `forEach` method)
      const mapMapping = () => field.mapping({ model, key: field.key, newModel, parentModel, originModel, i18n: this.$t, $tc: this.$tc, $t: this.$t, ctx: this.ctx })
      const mapFields = (sourceModel) => {
        if (!sourceModel[field.key] && field.default) return field.default
        if (Array.isArray(sourceModel[field.key]))
          return sourceModel[field.key].filter((m) => {
            if (field.filter) return field.filter(m)
            else return true
          }).map(m => this.extractModel.bind(this, field.fields, m, sourceModel, originModel)())
        else
          return this.extractModel(field.fields, sourceModel[field.key], sourceModel, originModel)
      }

      let result = false

      // Handle mapping
      if (field.mapping) result = mapMapping()
      // Handle fields and inject mapping result if present
      if (field.fields) result = mapFields(result ? { [`${field.key}`]: result, ...parentModel } : model)
      if (!field.mapping && !field.fields && field.default) result = model[field.key] || field.default

      // Avoid adding mapping result when null
      if (field.merge && result !== null) Object.assign(newModel, result)
      else newModel[normalizedKey] = result
    })

    return newModel
  }

  static getEmptyModel (fields) {
    const model = {}

    fields.forEach((field) => {
      if (isString(field)) model[field] = null
      else model[field.key] = null
    })

    return model
  }
}

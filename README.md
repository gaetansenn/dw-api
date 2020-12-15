# dw-ui
Dewib api wrap all your request into one place and map your response for your needs.

## Install

Add package `yarn add @dewib/dw-api`

## Usage

Add your main service into `./dewib/api` folder

```js
import UserService from './user/index'

export default {
  UserService
}
```

Then your service should look like

```js
import { Model } from '@dewib/dw-api/utils'
/**
 *
 *
 * @export
 * @class UserService
 * @extends {Model}
 */
export default class UserService extends Model {
  /**
   * Create user
   * @param {*} user
   * @returns {Promise<*>} User model
   */
  store (user, params) {
    return this.$http...
  }
}
```

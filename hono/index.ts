import 'server-only'
import { Hono } from 'hono'
import settings from '~/hono/settings'
import auth from '~/hono/auth'
import file from '~/hono/file'
import images from '~/hono/images'
import albums from '~/hono/albums'
import alist from '~/hono/storage/alist'
import storage from '~/hono/storage'
import { HTTPException } from 'hono/http-exception'

const route = new Hono()

route.onError((err, c) => {
  if (err instanceof HTTPException) {
    console.error(err)
    return err.getResponse()
  }
  return c.json({ error: err.message }, 500)
})

route.route('/settings', settings)
route.route('/auth', auth)
route.route('/file', file)
route.route('/images', images)
route.route('/albums', albums)
route.route('/storage/alist', alist)
route.route('/storage', storage)

export default route
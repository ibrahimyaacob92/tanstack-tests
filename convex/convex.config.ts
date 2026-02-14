import { defineApp } from 'convex/server'
import r2 from '@convex-dev/r2/convex.config'
import fs from 'convex-fs/convex.config'

const app = defineApp()
app.use(r2)
app.use(fs)

export default app

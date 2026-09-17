/* eslint-disable */
// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as HealthRouteImport } from './routes/health'
import { Route as PredictRouteImport } from './routes/predict'
import { Route as ApiHealthRouteImport } from './routes/api/health'
import { Route as ApiPredictRouteImport } from './routes/api/predict'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const HealthRoute = HealthRouteImport.update({ id: '/health', path: '/health', getParentRoute: () => rootRouteImport } as any)
const PredictRoute = PredictRouteImport.update({ id: '/predict', path: '/predict', getParentRoute: () => rootRouteImport } as any)
const ApiHealthRoute = ApiHealthRouteImport.update({ id: '/api/health', path: '/api/health', getParentRoute: () => rootRouteImport } as any)
const ApiPredictRoute = ApiPredictRouteImport.update({ id: '/api/predict', path: '/api/predict', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/health': typeof HealthRoute
  '/predict': typeof PredictRoute
  '/api/health': typeof ApiHealthRoute
  '/api/predict': typeof ApiPredictRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/health': typeof HealthRoute
  '/predict': typeof PredictRoute
  '/api/health': typeof ApiHealthRoute
  '/api/predict': typeof ApiPredictRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/health': typeof HealthRoute
  '/predict': typeof PredictRoute
  '/api/health': typeof ApiHealthRoute
  '/api/predict': typeof ApiPredictRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/health' | '/predict' | '/api/health' | '/api/predict'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/health' | '/predict' | '/api/health' | '/api/predict'
  id: '__root__' | '/' | '/health' | '/predict' | '/api/health' | '/api/predict'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  HealthRoute: typeof HealthRoute
  PredictRoute: typeof PredictRoute
  ApiHealthRoute: typeof ApiHealthRoute
  ApiPredictRoute: typeof ApiPredictRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/health': { id: '/health'; path: '/health'; fullPath: '/health'; preLoaderRoute: typeof HealthRouteImport; parentRoute: typeof rootRouteImport }
    '/predict': { id: '/predict'; path: '/predict'; fullPath: '/predict'; preLoaderRoute: typeof PredictRouteImport; parentRoute: typeof rootRouteImport }
    '/api/health': { id: '/api/health'; path: '/api/health'; fullPath: '/api/health'; preLoaderRoute: typeof ApiHealthRouteImport; parentRoute: typeof rootRouteImport }
    '/api/predict': { id: '/api/predict'; path: '/api/predict'; fullPath: '/api/predict'; preLoaderRoute: typeof ApiPredictRouteImport; parentRoute: typeof rootRouteImport }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute, HealthRoute, PredictRoute, ApiHealthRoute, ApiPredictRoute,
}
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { createStart } from '@tanstack/react-start'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
  }
}

import { Router } from 'express'
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js'

const router = Router()

// 项目路由
router.get('/', getProjects)           // GET /api/projects
router.get('/:id', getProject)         // GET /api/projects/:id
router.post('/', createProject)        // POST /api/projects
router.put('/:id', updateProject)      // PUT /api/projects/:id
router.delete('/:id', deleteProject)   // DELETE /api/projects/:id

export default router

# Public 
    - Browse active projects
    - Browse open position in projects.
    - Successfully completed projects.
    - Scrapped projects.
    - Search for Manager public info ( project success rate, etc)
    - Search for Employee public info ( project success rate, etc )

# Role: Manager
    - Create project
    - Create task
    - Assign Employee to task

# Role: Employee
    - Complete task ( submit solution )
    - Personal info ( name, age, etc.)
    - Professional info ( profession, qualification, level, etc )

# Project
    - General info ( name, description, etc)
    - Manager
    - Employees 
        - Hours worked
        - Tasks completed
    - Tasks

# MongoDb Collections
    - Managers
    - Employees
    - Projects
    
# Routes
## 1. Public
    - / ( publicController.index() )
    - /login ( publicController.login() )
    - /managers ( managersController.all() ) - search for managers
    - /managers/:id ( managersController.details(id) ) - manager public info  
    - /employees ( employeesController.all() ) - search for employees
    - /employees/:id ( employeesController.details(id) ) - employee public info    
    - /projects ( projectsController.all() ) - search for projects
    - /projects/:id ( projectsController.details(id) ) - projects public info    

## 2. Mnager ( logged in )
    - /profile ( managersController.profile() ) - personal info
    - /manage ( managersController.index() ) - list of projects, create projects etc
    - /manage/:projectId ( managersController.project(projectId) ) - search employee, assign employee to task, add task

## 3. Employee ( logged in )
    - /profile ( employeesController.profile() ) - personal info
    - /employee ( employeesController.index() ) - list of projects
    - /employee/:projectId ( employeesController.project(projectId) ) - list of tasks, submit work
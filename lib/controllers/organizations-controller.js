/* globals Promise */

'use strict';

module.exports = function ({organizationsData, userData, logger}) {
  function index(req, res) {
    const page = +req.query.page || 0;
    const size = +req.query.size || 5;

    organizationsData.findPage(page, size)
      .then(([organizations, pageCount]) => {
        const pagination = {
          active: +pageCount > 1,
          pageSize: size,
          previous: {
            active: +page > 0,
            value: +page - 1
          },
          next: {
            active: +page < +pageCount - 1,
            value: +page + 1
          }
        };

        res.status(200)
          .render('./organizations/index', {
            isAuthenticated: req.isAuthenticated(),
            result: {
              user: req.user,
              organizations,
              pagination
            }
          });
      })
      .catch((err) => {
        logger.info(err.message);
        res.status(400).redirect('/error');
      });
  }

  function search(req, res) {
    const isAuthenticated = req.isAuthenticated();

    organizationsData.getOrganizationsWhichContains(req.query.search)
      .then((organizations) => {
        res.status(200)
          .render('./organizations/organizations-list', {
            isAuthenticated,
            result: {
              data: organizations,
              user: req.user
            }
          });
      })
      .catch((err) => {
        logger.info(err.message);
        res.status(400).redirect('/error');
      });
  }

  function details(req, res) {
    const organizationId = req.params.organizationId;
    const isAuthenticated = req.isAuthenticated();

    organizationsData.findById(organizationId)
      .then((organization) => {
        if (!organization) {
          logger.info(`Organization with ID: ${organizationId} not found.`);
          res.status(400).redirect('/organizations/not-found');
        }

        const user = req.user;
        let isMember;
        if (user) {
          isMember = user.organization.name === organization.name;
        }

        if (user && !isMember) {
          isMember = organization.owners.some(o => o.username === user.username);
        }

        res.status(200)
          .render('./organizations/details', {
            result: {
              user,
              isMember,
              organization
            },
            isAuthenticated
          });
      })
      .catch((err) => {
        logger.info(err.message);
        res.status(400).redirect('/error');
      });
  }

  function createOrganizationForm(req, res) {
    const isAuthenticated = req.isAuthenticated();
    if (!isAuthenticated) {
      return res.status(401).redirect('/account/login');
    }

    return res.status(200)
      .render('./organizations/create', {
        isAuthenticated,
        result: {
          user: req.user
        }
      });
  }

  function createOrganization(req, res) {
    const isAuthenticated = req.isAuthenticated();
    if (!isAuthenticated) {
      return res.status(401).redirect('/account/login');
    }

    const inputOrganization = req.body;
    const owners = [{
      username: req.user.username,
      ownerId: req.user._id
    }];

    inputOrganization.owners = owners;

    return organizationsData.createOrganization(inputOrganization)
      .then((organization) => {
        const user = req.user;
        user.organization = {
          name: organization.name,
          organizationId: organization._id
        };

        return userData.updateUser(user);
      })
      .then((user) => {
        const redirectUrl = `/organizations/${user.organization.organizationId}`;
        res.status(200)
          .json({
            message: `Successfully created ${user.organization.name}`,
            redirectUrl
          });
      })
      .catch((err) => {
        logger.info(err.message);
        res.status(400)
          .json({
            message: err.message
          });
      });
  }

  function applyForm(req, res) {
    const isAuthenticated = req.isAuthenticated();
    if (!isAuthenticated) {
      return res.status(401).redirect('/account/login');
    }

    const organizationId = req.params.organizationId;
    if (!organizationId) {
      logger.info('Orgnization ID not found in request parameters.');
      return res.status(400).redirect('/error');
    }

    return organizationsData.findById(organizationId)
      .then((organization) => {
        if (!organization) {
          logger.info(`Organization with ID: ${organizationId} not found.`);
          return res.status(400).redirect('/organizations/not-found');
        }

        return res.status(200)
          .render('./organizations/apply', {
            isAuthenticated,
            result: {
              user: req.user,
              organization
            }
          });
      })
      .catch((err) => {
        logger.info(err.message);
        res.status(400).redirect('/error');
      });
  }

  function addApplication(req, res) {
    const isAuthenticated = req.isAuthenticated();
    if (!isAuthenticated) {
      return res.status(401).redirect('/account/login');
    }

    const organizationId = req.params.organizationId;
    if (!organizationId) {
      logger.info('Orgnization ID not found in request parameters.');
      return res.status(400).redirect('/error');
    }

    const newApplication = req.body;
    if (!newApplication) {
      logger.info('New application information not contained in request body.');
      return res.status(400).redirect('/error');
    }

    const user = req.user;
    return organizationsData.findById(organizationId)
      .then((organization) => {
        if (!organization) {
          logger.info(`Organization with ID: ${organizationId} not found.`);
          return res.status(400).redirect('/organizations/not-found');
        }

        organization.applications = organization.applications || [];
        const userHasAlreadyApplied = organization.applications.some(a => a.username === user.username);
        if (userHasAlreadyApplied) {
          return res.status(200)
            .render('./organizations/apply-fail', {
              isAuthenticated,
              result: {
                user
              }
            });
        }

        organization.applications.push({
          username: user.username,
          userId: user._id,
          comment: newApplication.comment
        });

        return organizationsData.updateOrganization(organization);
      })
      .then(() => {
        res.status(200)
          .render('./organizations/apply-success', {
            isAuthenticated,
            result: {
              user
            }
          });
      })
      .catch((err) => {
        logger.info(err.message);
        res.status(400).redirect('/error');
      });
  }

  function listApplications(req, res) {
    const isAuthenticated = req.isAuthenticated();
    if (!isAuthenticated) {
      return res.status(401).redirect('/account/login');
    }

    const organizationId = req.params.organizationId;
    if (!organizationId) {
      logger.info('Orgnization ID not found in request parameters.');
      return res.status(400).redirect('/error');
    }

    // return res.send('I WUZ HEER');
    return organizationsData.findById(organizationId)
      .then((organization) => {
        if (!organization) {
          logger.info(`Organization with ID: ${organizationId} not found.`);
          return res.status(400).redirect('/organizations/not-found');
        }

        return res.status(200)
          .render('./organizations/applications-list', {
            isAuthenticated,
            result: {
              user: req.user,
              organization
            }
          });
      })
      .catch((err) => {
        logger.info(err.message);
        return res.status(400).redirect('/error');
      });
  }

  function approveApplication(req, res) {
    const isAuthenticated = req.isAuthenticated();
    if (!isAuthenticated) {
      return res.status(401).redirect('/account/login');
    }

    const organizationId = req.params.organizationId;
    if (!organizationId) {
      logger.info('Orgnization ID not found in request parameters.');
      return res.status(400).redirect('/error');
    }

    const userId = req.params.userId;
    if (!userId) {
      logger.info('User ID not found in request parameters.');
      return res.status(400).redirect('/error');
    }

    return Promise.all([
      organizationsData.findById(organizationId),
      userData.getUserById(userId)
    ])
      .then(([organization, user]) => {
        if (!organization) {
          logger.info(`Organization with ID: ${organizationId} not found.`);
          return res.status(400).redirect('/organizations/not-found');
        }

        if (!user) {
          logger.info(`User with ID: ${userId} not found.`);
          return res.status(400).redirect('/error');
        }

        const userAlreadyAssigned = organization.unassigned.some(u => u.username === user.username);
        if (userAlreadyAssigned) {
          return res.status(400).redirect('/error');
        }

        if (user.organization) {
          return Promise.all([
            new Promise(resolve => resolve(organization)),
            new Promise(resolve => resolve(user)),
            organizationsData.findByName(user.organization.name)
          ]);
        }

        return Promise.all([
          new Promise(resolve => resolve(organization)),
          new Promise(resolve => resolve(user))
        ]);
      })
      .then(([organization, user, previousOrganization]) => {
        organization.unassigned.push({
          username: user.username,
          unassignedId: user._id
        });

        organization.applications = organization.applications.filter(a => a.username !== user.username);

        if (previousOrganization !== null) {
          return Promise.all([
            organizationsData.updateOrganization(organization),
            organizationsData.updateOrganization(previousOrganization),
            userData.updateUser(user)
          ]);
        }

        return Promise.all([
          organizationsData.updateOrganization(organization),
          userData.updateUser(user)
        ]);
      })
      .then(() => {
        res.status(200).redirect(`/organizations/${organizationId}/employees`);
      })
      .catch((err) => {
        logger.info(err.message);
        res.status(400).redirect('/error');
      });
  }

  function declineApplication(req, res) {
    const isAuthenticated = req.isAuthenticated();
    if (!isAuthenticated) {
      return res.status(401).redirect('/account/login');
    }

    const organizationId = req.params.organizationId;
    if (!organizationId) {
      logger.info('Orgnization ID not found in request parameters.');
      return res.status(400).redirect('/error');
    }

    const userId = req.params.userId;
    if (!userId) {
      logger.info('User ID not found in request parameters.');
      return res.status(400).redirect('/error');
    }

    // return res.send('I WUZ HEER');
    return organizationsData.findById(organizationId)
      .then((organization) => {
        if (!organization) {
          logger.info(`Organization with ID: ${organizationId} not found.`);
          return res.status(400).redirect('/organizations/not-found');
        }

        organization.applications = organization.applications.filter(a => a.userId !== userId);

        return organizationsData.updateOrganization(organization);
      })
      .then(() => {
        return res.status(200).redirect(`/organizations/${organizationId}/employees`);
      })
      .catch((err) => {
        logger.info(err.message);
        res.status(400).redirect('/error');
      });
  }

  return {
    index,
    search,
    details,
    createOrganizationForm,
    createOrganization,
    applyForm,
    addApplication,
    listApplications,
    approveApplication,
    declineApplication
  };
};
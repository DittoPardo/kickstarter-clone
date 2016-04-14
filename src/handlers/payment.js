import User from '../models/user';
import Project from '../models/project';

var stripe = require('stripe')(process.env.STRIPE_API_KEY);

const paymentHandler = {
  // User needs to login to the platform to be able to back a project
  backProject(req, res) {

    console.log('***Back Project\n', req.body);

    // 1. Need to find "connected stripe account id" of the project creator
    // Retrieve the id by populating 'user.stripe' fields
    const populateQuery = [
      { path: 'createdBy', select: 'stripe' },
      { path: 'rewards' }
    ];

    Project.findById(req.params.projectid).populate(populateQuery).exec(function(err, project) {
      if (err) {
        req.flash('danger', 'Could not find the project / user. Try again.');
        return res.redirect(`/projects/${req.params.projectid}/rewards`);
      }
      // Option 1: Charge directly
      // https://stripe.com/docs/connect/payments-fees#charging-directly

      stripe.charges.create({
        amount: req.body.chosenAmount * 100,
        currency: 'cad',
        source: req.body.stripeToken,
        description: req.body.chosenDescription,
        application_fee: 100
      }, {
        stripe_account: project.createdBy.stripe.stripe_user_id
      }, function(error, charge) {
        if (error) {

          console.log('Stripe Charge Failed: \n', error);
          req.flash('danger', error.message);
          return res.redirect(`/projects/${req.params.projectid}/rewards`);
        }

        console.log('Charge Complete: \n', charge);
        req.flash('success', 'Successfully backed the project!');
        return res.redirect(`/projects/${req.params.projectid}`);
      });
      
      // Option 2: Charge through platform
      // https://stripe.com/docs/connect/payments-fees#charging-through-the-platform

      // stripe.charges.create({
      //   amount: 1000,
      //   currency: 'cad',
      //   source: req.body.stripeToken,
      //   description: 'Sample Charge!!',
      //   application_fee: 300,
      //   destination: project.createdBy.stripe.stripe_user_id
      // }, function(error, charge) {
      //   console.log('Charge Error: ', error);
      //   console.log('Charge Complete: ', charge);
      // });
    });
  }
};

export default paymentHandler;
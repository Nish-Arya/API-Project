const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const db = require("../db/models");
const { Tweet } = db;

const asyncHandler = (handler) => (req, res, next) =>
  handler(req, res, next).catch(next);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const tweets = await Tweet.findAll();
    res.json({ tweets });
  })
);

const tweetNotFoundError = id => {
  const err = new Error('Tweet not found.');
  err.errors = [`Tweet with id of ${id} could not be found.`];
  err.title = 'Tweet not found.';
  err.status = 404;
  return err;
}

router.get('/:id', asyncHandler(async (req, res, next) => {
  const tweet = await Tweet.findOne({
    where: {
      id: req.params.id,
    },
  });

  if (tweet) {
    res.json({ tweet });
  } else {
    next(tweetNotFoundError(req.params.id));
  }
}));

const validateTweet = [
  check('message')
    .exists({ checkFalsy: true })
    .withMessage('Tweet can\'t be empty.'),
  check('name')
    .isLength({ max: 280 })
    .withMessage('Tweet can\'t be longer than 280 characters.'),
];

const handleValidationErrors = (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    const errors = validationErrors.array().map((error) => error.msg);

    const err = Error("Bad request.");
    err.errors = errors;
    err.status = 400;
    err.title = "Bad request.";
    return next(err);
  }
  next();
};

router.post(
  '/',
  validateTweet,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    const tweet = await Tweet.create({ message });
    res.json({ tweet });
  })
);

router.put(
  '/:id',
  validateTweet,
  handleValidationErrors,
  asyncHandler(async (req, res, next) => {
    const tweet = await Tweet.findOne({
      where: {
        id: req.params.id,
      }
    })

    if (tweet) {
      await tweet.update({ message: req.body.message });
      res.json({ tweet });
    } else {
      next(tweetNotFoundError(req.params.id));
    }
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const tweet = await Tweet.findOne({
      where: {
        id: req.params.id,
      }
    })

    if (tweet) {
      await tweet.destroy();
      res.json({ message: `Deleted tweet with id of ${req.params.id}.` });
    } else {
      next(tweetNotFoundError(req.params.id));
    }
  })
);

module.exports = router;
const express = require("express");
const { CHALLENGES } = require("../config/challenges");

function createChallengesRouter(requireAuth) {
  const router = express.Router();
  router.get("/catalogue", requireAuth, (req, res) => {
    res.json(CHALLENGES);
  });

  return router;
}

module.exports = { createChallengesRouter };
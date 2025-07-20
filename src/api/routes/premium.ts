import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
   res.render("premium.ejs");
});

export default router;


export default (app) => {
  app.head('*', (req, res) => {
    res.status(200).end();
  });
};

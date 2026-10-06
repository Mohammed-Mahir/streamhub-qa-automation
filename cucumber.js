const common = {
  require: ['support/**/*.js', 'steps/**/*.js'],
  format: [
    'progress',
    'html:reports/cucumber-report.html',
    'json:reports/cucumber-report.json',
  ],
};

module.exports = {
  // Default run: everything except the intentionally-broken self-heal demo
  default: { ...common, paths: ['features/api/**/*.feature', 'features/ui/**/*.feature'] },
  selfheal: {
    ...common,
    paths: ['features/selfheal/**/*.feature'],
    format: ['progress', 'html:reports/selfheal-report.html'],
  },
};

workflow "Publish To NPM" {
  resolves = ["GitHub Action for npm"]
  on = "release"
}

action "GitHub Action for npm" {
  uses = "actions/npm@master"
  args = "publish --access public"
  env = {
    NPM_REGISTRY_URL = "registry.npmjs.org"
  }
  secrets = ["NPM_AUTH_TOKEN"]
}

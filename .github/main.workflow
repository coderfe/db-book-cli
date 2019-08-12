workflow "Publish To NPM" {
  resolves = ["GitHub Action for npm"]
  on = "release"
}

action "GitHub Action for npm" {
  uses = "actions/npm@master"
  secrets = ["NPM_TOKEN"]
  args = "publish"
}

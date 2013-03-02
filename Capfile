require "capistrano/node-deploy"

set :application, "speakers"
set :repository,  "git@github.com:/rickbutton/speakers"
set :user, "deploy"
set :scm, :git
set :deploy_to, "/var/app"
set :ssh_options, { :forward_agent => true }
default_run_options[:pty] = true
set :use_sudo, false

set :app_command, "app.js"
set :app_environment, "PORT=80"

role :app, "198.211.102.99"
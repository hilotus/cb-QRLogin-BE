require 'bundler'
require 'bundler/setup'

Bundler.require
require 'pry' if development? or test?

require 'sinatra/reloader' if development?
require 'sinatra/json'

require 'spear'

require File.expand_path('../app', __FILE__)

run QRLogin::App

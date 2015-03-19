module QRLogin
  class App < Sinatra::Application
    helpers Sinatra::JSON

    set :server, 'thin'

    configure do
      set :conns, {}
      Spear.config({dev_key: ENV['DEVELOPMENT_KEY'], use_model: true})
    end

    def connections; settings.conns end

    before do
      headers("Access-Control-Allow-Origin" => "*")
      headers("Access-Control-Allow-Methods" => "POST, GET, OPTIONS")
      headers("Access-Control-Allow-Headers" => "Origin, X-Requested-With, Content-Type, Accept")

      halt 200 if @env['REQUEST_METHOD'] == 'OPTIONS'
    end

    get '/' do
      erb :index
    end

    post '/login' do
      data = JSON.parse(request.body.read.to_s)
      res = Spear.check_existing(data['email'], data['password'])

      if res.success?
        json success: true, external_id: res.external_id, oauth_token: res.oauth_token
      else
        json success: false, error_message: res.error_message
      end
    end

    post '/sse' do
      gid = params['gid']
      connections[gid].close if connections[gid]
      connections.delete_if {|key, value| value.closed?}

      stream :keep_open do |out|
        connections[gid] = out
      end
    end

    post '/sse/message' do
      data = JSON.parse(request.body.read.to_s)
      connection = connections[data['gid']]

      if !connection.nil? && !connection.closed?
        res = Spear.token_authenticate(data['user_external_id'])
        if res.success?
          connection << "{\"success\": true, \"token_authentication_url\": \"#{res.token_authentication_url}\"}"
        else
          connection << "{\"success\": false, \"error_message\": \"#{res.error_message}\"}"
        end
        connection.close
      end
      halt 204
    end
  end
end

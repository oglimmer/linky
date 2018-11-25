module.exports = {

  config: {
    SchemaVersion: "1.0.0",
    Name: "linky",
    Vagrant: {
      Box: "ubuntu/xenial64",
      Install: "maven openjdk-8-jdk-headless docker.io nodejs"
    }
  },

  software: {
    
    lucenebuild: {
      Source: "mvn",
      Mvn: {
        Goal: 'package assembly:single'
      },
      Git: "https://github.com/rnewson/couchdb-lucene",
      Dir: "$$TMP$$/lucene",
      Artifact: "$$TMP$$/lucene-bin/bin/run",
      BeforeBuild: [
        "sed -i.bak 's/allowLeadingWildcard=false/allowLeadingWildcard=true/g' src/main/resources/couchdb-lucene.ini",
        "sed -i '' 's/host=localhost/host=0.0.0.0/g' src/main/resources/couchdb-lucene.ini"
      ],
      AfterBuild: [
        "mv -f src/main/resources/couchdb-lucene.ini.bak src/main/resources/couchdb-lucene.ini",
        "mkdir -p \"$BASE_PWD/$$TMP$$/lucene-bin\"",
        "tar -xvf target/*.tar.gz --strip 1 -C \"$BASE_PWD/$$TMP$$/lucene-bin\""
      ],
      luceneConfig: {
        Name: "couchdb-lucene.ini",
        Connections: [{
          Source: "cdb",
          Regexp: "url=",
          Line: "url=http://$$VALUE$$:5984/"
        }],
        Content: [
          { Line: "allowLeadingWildcard=true" },
          { Line: "host=0.0.0.0" }
        ],
        LoadDefaultContent: "$$TMP$$/lucene/src/main/resources/couchdb-lucene.ini",
        AttachIntoDocker: "/home/node/exec_env/localrun/lucene-bin/conf" 
      }
    },

    lucene: {
      Source: "java",
      Start: "lucenebuild",
      ExposedPort: 5985
    },

    cdb: {
      Source: "couchdb",
      CouchDB: [
        {
          Schema: "linky",
          Create: [
            "build/couchdb/linky/_design-asyncWait-curl.json",
            "build/couchdb/linky/_design-debug-curl.json",
            "build/couchdb/linky/_design-feedUpdates-curl.json",
            "build/couchdb/linky/_design-hierarchy-curl.json",
            "build/couchdb/linky/_design-links-curl.json",
            "build/couchdb/linky/_design-lucene-curl.json",
            "build/couchdb/linky/_design-users-curl.json",
            "build/couchdb/linky/_design-visitors-curl.json"
          ]
        }, {
          Schema: "linky_archive",
          Create: [ "build/couchdb/linky-archive/_design-archives-curl.json" ]
        }
      ],
      couchconfig: {
        Name: "local.ini",
        Connections: [{
          Source: "lucene",
          Line: "_fti={couch_httpd_proxy, handle_proxy_req, <<\\\"http://$$VALUE$$:5985\\\">>}"
        }],
        Content: [
          { Line: "[httpd_global_handlers]" },
          { Line: "_fti=" }
        ],
        AttachIntoDocker: "/usr/local/etc/couchdb/local.d" 
      }
    },

    linky: {
      Source: "node",
      Start: "server/",
      Node: {
        Param: "-r babel-register -r babel-polyfill --trace-warnings"
      },
      ExposedPort: 8080,
      configFile: {
        Name: "linky.properties",
        Connections: [ { Source:"cdb", Regexp: "db.host=", Line: "db.host=$$VALUE$$" } ],
        Content: [
          { Line: "archive.protocol=" },
          { Line: "archive.domain=" }
        ],
        LoadDefaultContent: "server/util/linky_default.properties",
        AttachAsEnvVar: ["LINKY_PROPERTIES", "$$SELF_NAME$$"]
      },
      EnvVars: [
        "NODE_ENV=\"development\"",
        "PROXY_PORT=\"8080\"",
        "PROXY_BIND=\"0.0.0.0\"",
        "PORT=\"8080\"",
        "BIND=\"0.0.0.0\""
      ]
    }

  }
}

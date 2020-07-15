module.exports = {

  config: {
    SchemaVersion: "1.0.0",
    Name: "linky",
    Vagrant: {
      Box: "ubuntu/xenial64",
      Install: "maven openjdk-8-jdk-headless docker.io nodejs"
    }
  },

  versions: {
    lucenebuild: {
      TestedWith: "3-jdk-11",
    },
    lucene: {
      TestedWith: "11",
    },
    cdb: {
      Docker: "1.7",
      KnownMax: "1.7"
    },
    linky: {
      TestedWith: "10 & 11"
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
        "sed -i.bak 's/host=localhost/host=0.0.0.0/g' src/main/resources/couchdb-lucene.ini"
      ],
      AfterBuild: [
        "mv -f src/main/resources/couchdb-lucene.ini.bak src/main/resources/couchdb-lucene.ini",
        "mkdir -p \"$BASE_PWD/$$TMP$$/lucene-bin\"",
        "tar -xvf target/*.tar.gz --strip 1 -C \"$BASE_PWD/$$TMP$$/lucene-bin\""
      ],
      luceneConfig: {
        Name: "couchdb-lucene.ini",        
        Content: [
          { Regexp: "^allowLeadingWildcard=", Line: "allowLeadingWildcard=true" },
          { Regexp: "^host=", Line: "host=0.0.0.0" },
          {
            Source: "cdb",
            Regexp: "^url.*=",
            Line: "url=http://$$VALUE$$:5984/"
          }
        ],
        LoadDefaultContent: "https://raw.githubusercontent.com/rnewson/couchdb-lucene/master/src/main/resources/couchdb-lucene.ini",
        AttachIntoDocker: "/home/node/exec_env/localrun/lucene-bin/conf" 
      }
    },

    lucene: {
      Source: "java",
      DockerImage: "adoptopenjdk/openjdk11-openj9",
      DockerMemory: "150M",
      Start: "lucenebuild",
      ExposedPort: 5985
    },

    cdb: {
      Source: "couchdb",
      DockerMemory: "200M",
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
        Content: [
          { Line: "[httpd_global_handlers]" },
          {
            Source: "lucene",
            Line: "_fti={couch_httpd_proxy, handle_proxy_req, <<\"http://$$VALUE$$:5985\">>}"
          }
        ],
        AttachIntoDocker: "/usr/local/etc/couchdb/local.d" 
      }
    },

    linky: {
      Source: "node",
      DockerMemory: "200M",
      Start: "server/",
      Node: {
        Param: "-r babel-register -r babel-polyfill --trace-warnings"
      },
      ExposedPort: 8080,
      configFile: {
        Name: "linky.properties",
        Content: [
          { Regexp: "archive.protocol=", Line: "archive.protocol=" },
          { Regexp: "archive.domain=", Line: "archive.domain=" },
          { Source:"cdb", Regexp: "db.host=", Line: "db.host=$$VALUE$$" }
        ],
        LoadDefaultContent: "server/util/linky_default.properties",
        AttachAsEnvVar: ["LINKY_PROPERTIES", "$$SELF_NAME$$"]
      },
      EnvVars: [
        { Name: "NODE_ENV", Value: "development" },
        { Name: "PROXY_PORT", Value: "8080" },
        { Name: "PROXY_BIND", Value: "0.0.0.0" },
        { Name: "PORT", Value: "8080" },
        { Name: "BIND", Value: "0.0.0.0" }
      ]
    }

  }
}

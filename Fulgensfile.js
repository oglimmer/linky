module.exports = {

  config: {
    Name: "linky",
    Vagrant: {
      Box: "ubuntu/xenial64",
      Install: "npm docker.io"
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
        "sed -i.bak 's/allowLeadingWildcard=false/allowLeadingWildcard=true/g' src/main/resources/couchdb-lucene.ini"
      ],
      AfterBuild: [
        "mv -f src/main/resources/couchdb-lucene.ini.bak src/main/resources/couchdb-lucene.ini",
        "mkdir -p \"$BASE_PWD/$$TMP$$/lucene-bin\"",
        "tar -xvf target/*.tar.gz --strip 1 -C \"$BASE_PWD/$$TMP$$/lucene-bin\""
      ]
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
          Var: "_fti",
          Content: "{couch_httpd_proxy, handle_proxy_req, <<\\\"http://$$VALUE$$:5985\\\">>}"
        }],
        Content: [
          "[httpd_global_handlers]",
          "_fti="
        ],
        AttachIntoDocker: "/usr/local/etc/couchdb/local.d" 
      }
    },

    linky: {
      Source: "node",
      Artifact: "server/",
      Node: {
        Param: "-r babel-register -r babel-polyfill --trace-warnings"
      },
      ExposedPort: 8080,
      configFile: {
        Name: "linky.properties",
        Connections: [ { Source:"cdb", Var: "db.host" } ],
        LoadDefaultContent: "server/util/linky_default.properties",
        AttachAsEnvVar: ["LINKY_PROPERTIES", "$$SELF_NAME$$"]
      },
      EnvVars: [
        "NODE_ENV=\"development\"",
        "PROXY_PORT=\"8080\"",
        "PROXY_BIND=\"0.0.0.0\""
      ]
    }

  }
}

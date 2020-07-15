#!/usr/bin/env bash

# DO NOT EDIT THIS FILE!
# Generated by fulgens (https://www.npmjs.com/package/fulgens)
# Version: 0.0.23

trap cleanup 2
set -e

#---------------------
# START - FunctionsBuilder

jdk_version() {

  # returns the JDK version.
  # 8 for 1.8.0_nn, 9 for 9-ea etc, and "no_java" for undetected
  # from https://stackoverflow.com/questions/7334754/correct-way-to-check-java-version-from-bash-script
  local result
  local java_cmd
  if [[ -n $(type -p java) ]]; then
    java_cmd=java
  elif [[ (-n "$JAVA_HOME") && (-x "$JAVA_HOME/bin/java") ]]; then
    java_cmd="$JAVA_HOME/bin/java"
  fi
  local IFS=$'\n'
  # remove \r for Cygwin
  local lines=$("$java_cmd" -Xms32M -Xmx32M -version 2>&1 | tr '\r' '\n')
  if [[ -z $java_cmd ]]; then
    result=no_java
  else
    for line in $lines; do
      if [[ (-z $result) && ($line = *"version \""*) ]]; then
        local ver=$(echo $line | sed -e 's/.*version "\(.*\)"\(.*\)/\1/; 1q')
        # on macOS, sed doesn't support '?'
        if [[ $ver = "1."* ]]; then
          result=$(echo $ver | sed -e 's/1\.\([0-9]*\)\(.*\)/\1/; 1q')
        else
          result=$(echo $ver | sed -e 's/\([0-9]*\)\(.*\)/\1/; 1q')
        fi
      fi
    done
  fi
  echo "$result"

}

# END - FunctionsBuilder
#---------------------

verbosePrint() {
  if [ "$VERBOSE" == "YES" ]; then
    echo -e "$1"
  fi
}

startDockerNetwork() {
  if [ -z "$DOCKER_NETWORKED_CHECKED" ]; then
    DOCKER_NETWORKED_CHECKED=YES
    if ! docker network ls | grep -s "linkynet"; then
      verbosePrint "Starting docker network linkynet on 10.56.251.0/24"
      docker network create -d bridge --subnet 10.56.251.0/24 --gateway 10.56.251.1 "linkynet"
    else
      verbosePrint "Docker network linkynet already running"
    fi
  fi
}

#---------------------
# START - CleanupBuilder

cleanup() {
  echo "****************************************************************"
  echo "Stopping software .....please wait...."
  echo "****************************************************************"
  set +e

  ALL_COMPONENTS=(lucene cdb linky)
  for componentToStop in "${ALL_COMPONENTS[@]}"; do
    IFS=',' read -r -a keepRunningArray <<<"$KEEP_RUNNING"
    componentFoundToKeepRunning=0
    for keepRunningToFindeElement in "${keepRunningArray[@]}"; do
      if [ "$componentToStop" == "$keepRunningToFindeElement" ]; then
        echo "Not stopping $componentToStop!"
        componentFoundToKeepRunning=1
      fi
    done
    if [ "$componentFoundToKeepRunning" -eq 0 ]; then

      if [ "$START_LUCENE" = "YES" ]; then
        if [ "$componentToStop" == "lucene" ]; then
          echo "Stopping $componentToStop ..."

          if [ "$TYPE_SOURCE_LUCENE" == "local" ]; then
            kill $javaPIDlucene
            rm -f .lucenePid
          fi

          if [ "$TYPE_SOURCE_LUCENE" == "docker" ]; then
            docker rm -f $dockerContainerIDlucene
            rm -f .lucenePid
          fi

        fi
      fi

      if [ "$START_CDB" = "YES" ]; then
        if [ "$componentToStop" == "cdb" ]; then
          echo "Stopping $componentToStop ..."

          if [ "$TYPE_SOURCE_CDB" == "docker" ]; then
            docker rm -f $dockerContainerIDcdb
            rm -f .cdbPid
          fi

        fi
      fi

      if [ "$START_LINKY" = "YES" ]; then
        if [ "$componentToStop" == "linky" ]; then
          echo "Stopping $componentToStop ..."

          if [ "$TYPE_SOURCE_LINKY" == "docker" ]; then
            docker rm -f $dockerContainerIDlinky
            rm -f .linkyPid
          fi

          if [ "$TYPE_SOURCE_LINKY" == "local" ]; then
            ps -p $processIdlinky >/dev/null && kill $processIdlinky
            rm -f .linkyPid
          fi

        fi
      fi

    fi
  done

  exit 0
}

# END - CleanupBuilder
#---------------------

#---------------------
# START - OptionsBuilder

usage="
usage: $(basename "$0") [options] [<component(s)>]

Options:
  -h                         show this help text
  -s                         skip any build
  -S                         skip consistency check against Fulgensfile
  -c [all|build]             clean local run directory, when a build is scheduled for execution it also does a full build
  -k [component]             keep comma sperarated list of components running
  -t [component:type:[path|version]] run component inside [docker] container, [download] component or [local] use installed component from path
  -v                         enable Verbose
  -V                         start VirtualBox via vagrant, install all dependencies, ssh into the VM and run
  -j version                 macOS only: set/overwrite JAVA_HOME to a specific locally installed version, use format from/for: /usr/libexec/java_home [-V]
  -f                         tail the nodejs log at the end
  
Url: http://localhost:8080

Details for components:
lucenebuild {Source:\"mvn\", Default-Type:\"local\", Version-Info: \"Tested with 3-jdk-11\"}
  -t lucenebuild:local #build local and respect -j
  -t lucenebuild:docker:[TAG] #docker based build, default tag: latest, uses image https://hub.docker.com/_/maven
lucene {Source:\"java\", Default-Type:\"docker:latest\", Version-Info: \"Tested with 11\"}
  -t lucene:local #start a local java program
  -t lucene:docker:[TAG] #start inside docker, default tag latest, uses image https://hub.docker.com/r/adoptopenjdk/openjdk11-openj9
cdb {Source:\"couchdb\", Default-Type:\"docker:1.7\", Version-Info: \"Max 1.7\"}
  -t cdb:local #reuse a local, running CouchDB installation, does not start/stop this CouchDB
  -t cdb:docker:[TAG] #start docker, default tag 1.7, uses image https://hub.docker.com/_/couchdb
linky {Source:\"node\", Default-Type:\"local\", Version-Info: \"Tested with 10 & 11\"}
  -t linky:local #reuse a local node installation
  -t linky:docker:[TAG] #start docker, default tag latest, uses image https://hub.docker.com/_/node
"

cd "$(
  cd "$(dirname "$0")"
  pwd -P
)"
BASE_PWD=$(pwd)

BUILD=local
while getopts ':hsSc:k:x:t:vVj:f' option; do
  case "$option" in
  h)
    echo "$usage"
    exit
    ;;
  s) SKIP_BUILD=YES ;;
  S) SKIP_HASH_CHECK=YES ;;
  c)
    CLEAN=$OPTARG
    if [ "$CLEAN" != "all" -a "$CLEAN" != "build" ]; then
      echo "Illegal -c parameter" && exit 1
    fi
    ;;
  k) KEEP_RUNNING=$OPTARG ;;
  x) SKIP_STARTING=$OPTARG ;;
  t) TYPE_SOURCE=$OPTARG ;;
  v) VERBOSE=YES ;;

  V) VAGRANT=YES ;;

  j) JAVA_VERSION=$OPTARG ;;

  f) TAIL=YES ;;

  :)
    printf "missing argument for -%s\\n" "$OPTARG" >&2
    echo "$usage" >&2
    exit 1
    ;;
  \\?)
    printf "illegal option: -%s\\n" "$OPTARG" >&2
    echo "$usage" >&2
    exit 1
    ;;
  esac
done
shift $((OPTIND - 1))

if [ -z "$1" ]; then

  declare START_LUCENEBUILD=YES

  declare START_LUCENE=YES

  declare START_CDB=YES

  declare START_LINKY=YES

else
  ALL_COMPONENTS=(LUCENEBUILD LUCENE CDB LINKY)
  for comp in "$@"; do
    compUpper=$(echo $comp | awk '{print toupper($0)}')
    compValid=0
    for compDefined in "${ALL_COMPONENTS[@]}"; do
      if [ "$compDefined" = "$compUpper" ]; then
        compValid=1
      fi
    done
    if [ "$compValid" -eq 0 ]; then
      echo "Component $comp is invalid!"
      exit 1
    fi
    declare START_$compUpper=YES
  done
fi

# END - OptionsBuilder
#---------------------

if [ "$SKIP_HASH_CHECK" != "YES" ]; then
  if which md5 1>/dev/null; then
    declare SELF_HASH_MD5="2efd04e40ffeb563e7e7ca4c8fcd8c5e"
    declare SOURCE_FILES=(Fulgensfile Fulgensfile.js)
    for SOURCE_FILE in ${SOURCE_FILES[@]}; do
      declare SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"
      if [ -f "$SCRIPT_DIR/$SOURCE_FILE" ]; then
        if [ "$SELF_HASH_MD5" != "$(md5 -q $SCRIPT_DIR/$SOURCE_FILE)" ]; then
          echo "$SOURCE_FILE doesn not match!"
          exit 1
        fi
      fi
    done
  fi
fi

#---------------------
# START - DependencycheckBuilder

mvn --version 1>/dev/null || exit 1
java -version 2>/dev/null || exit 1
docker --version 1>/dev/null || exit 1
node --version 1>/dev/null || exit 1
npm --version 1>/dev/null || exit 1

# END - DependencycheckBuilder
#---------------------

# clean if requested
if [ -n "$CLEAN" ]; then
  if [ "$CLEAN" == "all" ]; then
    if [ "$VERBOSE" == "YES" ]; then echo "rm -rf localrun"; fi
    rm -rf localrun
  fi

fi

#---------------------
# START - GlobalVariablesBuilder

verbosePrint "DEFAULT: TYPE_SOURCE_LUCENEBUILD=local"
TYPE_SOURCE_LUCENEBUILD=local

verbosePrint "DEFAULT: TYPE_SOURCE_LUCENE=local"
TYPE_SOURCE_LUCENE=local

verbosePrint "DEFAULT: TYPE_SOURCE_CDB=docker"
TYPE_SOURCE_CDB=docker

verbosePrint "DEFAULT: TYPE_SOURCE_LINKY=local"
TYPE_SOURCE_LINKY=local

# END - GlobalVariablesBuilder
#---------------------

if [ "$(uname)" = "Linux" ]; then
  ADD_HOST_INTERNAL="--add-host host.docker.internal:$(ip -4 addr show scope global dev docker0 | grep inet | awk '{print $2}' | cut -d / -f 1)"
fi

mkdir -p localrun

f_deploy() {
  echo "No plugin defined f_deploy()"
}

#---------------------
# START - PrepareBuilder

if [ "$(uname)" == "Darwin" ]; then
  if [ -n "$JAVA_VERSION" ]; then
    export JAVA_HOME=$(/usr/libexec/java_home -v $JAVA_VERSION)
  fi
fi

if [ "$VAGRANT" == "YES" -a "$VAGRANT_IGNORE" != "YES" ]; then
  mkdir -p localrun
  cd localrun
  cat <<-EOF >Vagrantfile
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/xenial64"
  config.vm.network "forwarded_port", guest: 8080, host: 8080
  config.vm.synced_folder "../", "/share_host"
  
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1536"
    vb.cpus = 4
  end
  config.vm.provision "shell", inline: <<-SHELL
  	
    apt-get update    
    
      if [ "\$(cat /etc/*release|grep ^ID=)" = "ID=debian"  ]; then \\
        if [ "\$(cat /etc/debian_version)" = "8.11" ]; then \\
           curl -sL https://deb.nodesource.com/setup_6.x | bash -; apt-get -qy install maven openjdk-8-jdk-headless docker.io nodejs; \\
        elif [ "\$(cat /etc/debian_version)" = "9.5" ]; then \\
          curl -sL https://deb.nodesource.com/setup_6.x | bash -; apt-get -qy install maven openjdk-8-jdk-headless docker.io nodejs; \\
        else curl -sL https://deb.nodesource.com/setup_10.x | bash -; apt-get -qy install maven openjdk-8-jdk-headless docker.io nodejs; fi \\
      elif [ "\$(cat /etc/*release|grep ^ID=)" = "ID=ubuntu"  ]; then \\
        curl -sL https://deb.nodesource.com/setup_10.x | bash -; apt-get -qy install maven openjdk-8-jdk-headless docker.io nodejs; \\
      else \\
        echo "only debian or ubuntu are supported."; \\
        exit 1; \\
      fi \\
    
    
    
    echo "Now continue with..."
    echo "\$ cd /share_host"
    echo "\$ sudo ./run_local.sh -f"
    echo "...then browse to http://localhost:8080"
  SHELL
end
EOF
  vagrant up
  if [ -f "../run_local.sh" ]; then
    vagrant ssh -c "cd /share_host && sudo ./run_local.sh -f"
  else
    echo "Save the fulgens output into a bash script (e.g. run_local.sh) and use it inside the new VM"
  fi
  exit 1
fi

# END - PrepareBuilder
#---------------------

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# MvnPlugin // lucenebuild
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
verbosePrint "MvnPlugin // lucenebuild"

if [ "$START_LUCENEBUILD" = "YES" ]; then

  #---------------------
  # START - Plugin-PrepareComp

  mkdir -p localrun/lucene

  OPWD="$(pwd)"
  cd "localrun/lucene"

  IFS=',' read -r -a array <<<"$TYPE_SOURCE"
  for typeSourceElement in "${array[@]}"; do
    IFS=: read comp type pathOrVersion <<<"$typeSourceElement"

    if [ "$comp" == "lucenebuild" ]; then
      TYPE_SOURCE_LUCENEBUILD=$type
      if [ "$TYPE_SOURCE_LUCENEBUILD" == "local" ]; then
        TYPE_SOURCE_LUCENEBUILD_PATH=$pathOrVersion
      else
        TYPE_SOURCE_LUCENEBUILD_VERSION=$pathOrVersion
      fi
    fi

  done

  if [ "$TYPE_SOURCE_LUCENEBUILD" == "docker" ]; then
    if [ -z "$TYPE_SOURCE_LUCENEBUILD_VERSION" ]; then
      TYPE_SOURCE_LUCENEBUILD_VERSION=latest
    fi

  fi

  verbosePrint "TYPE_SOURCE_LUCENEBUILD = $TYPE_SOURCE_LUCENEBUILD // TYPE_SOURCE_LUCENEBUILD_PATH = $TYPE_SOURCE_LUCENEBUILD_PATH // TYPE_SOURCE_LUCENEBUILD_VERSION = $TYPE_SOURCE_LUCENEBUILD_VERSION"

  # END - Plugin-PrepareComp
  #---------------------

  #---------------------
  # START - Plugin-GetSource

  if [ ! -d ".git" ]; then
    git clone --single-branch "https://github.com/rnewson/couchdb-lucene" .
  else
    git pull
  fi

  # END - Plugin-GetSource
  #---------------------

  if [ "$TYPE_SOURCE_LUCENEBUILD" == "local" ]; then
    f_build() {
      verbosePrint "pwd=$(pwd)\nmvn $MVN_CLEAN $MVN_OPTS package assembly:single"
      sed -i.bak 's/allowLeadingWildcard=false/allowLeadingWildcard=true/g' src/main/resources/couchdb-lucene.ini
      sed -i.bak 's/host=localhost/host=0.0.0.0/g' src/main/resources/couchdb-lucene.ini

      mvn $MVN_CLEAN $MVN_OPTS package assembly:single
      mv -f src/main/resources/couchdb-lucene.ini.bak src/main/resources/couchdb-lucene.ini
      mkdir -p "$BASE_PWD/localrun/lucene-bin"
      tar -xvf target/*.tar.gz --strip 1 -C "$BASE_PWD/localrun/lucene-bin"
    }
  fi

  if [ "$TYPE_SOURCE_LUCENEBUILD" == "docker" ]; then

    dockerImage=maven

    f_build() {
      verbosePrint "pwd=$(pwd)\ndocker run --name=lucenebuild --rm -v $(pwd):/usr/src/build -v "$(pwd)/localrun/.m2":/root/.m2 -w /usr/src/build $dockerImage:$TYPE_SOURCE_LUCENEBUILD_VERSION mvn $MVN_CLEAN $MVN_OPTS package assembly:single"
      sed -i.bak 's/allowLeadingWildcard=false/allowLeadingWildcard=true/g' src/main/resources/couchdb-lucene.ini
      sed -i.bak 's/host=localhost/host=0.0.0.0/g' src/main/resources/couchdb-lucene.ini
      docker run --name=lucenebuild --rm -v "$(pwd)":/usr/src/build -v "$(pwd)/localrun/.m2":/root/.m2 -w /usr/src/build $dockerImage:$TYPE_SOURCE_LUCENEBUILD_VERSION mvn $MVN_CLEAN $MVN_OPTS package assembly:single
      mv -f src/main/resources/couchdb-lucene.ini.bak src/main/resources/couchdb-lucene.ini
      mkdir -p "$BASE_PWD/localrun/lucene-bin"
      tar -xvf target/*.tar.gz --strip 1 -C "$BASE_PWD/localrun/lucene-bin"
    }
  fi

  if [ "$SKIP_BUILD" != "YES" ]; then
    if [ -n "$CLEAN" ]; then
      MVN_CLEAN=clean
    fi
    f_build
  else
    verbosePrint "Mvn build skipped."
  fi

  #---------------------
  # START - Plugin-LeaveComp

  cd "$OPWD"

# END - Plugin-LeaveComp
#---------------------

fi

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# JavaPlugin // lucene
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
verbosePrint "JavaPlugin // lucene"

if [ "$START_LUCENE" = "YES" ]; then

  #---------------------
  # START - Plugin-PrepareComp

  IFS=',' read -r -a array <<<"$TYPE_SOURCE"
  for typeSourceElement in "${array[@]}"; do
    IFS=: read comp type pathOrVersion <<<"$typeSourceElement"

    if [ "$comp" == "lucene" ]; then
      TYPE_SOURCE_LUCENE=$type
      if [ "$TYPE_SOURCE_LUCENE" == "local" ]; then
        TYPE_SOURCE_LUCENE_PATH=$pathOrVersion
      else
        TYPE_SOURCE_LUCENE_VERSION=$pathOrVersion
      fi
    fi

  done

  if [ "$TYPE_SOURCE_LUCENE" == "docker" ]; then
    if [ -z "$TYPE_SOURCE_LUCENE_VERSION" ]; then
      TYPE_SOURCE_LUCENE_VERSION=latest
    fi

  fi

  verbosePrint "TYPE_SOURCE_LUCENE = $TYPE_SOURCE_LUCENE // TYPE_SOURCE_LUCENE_PATH = $TYPE_SOURCE_LUCENE_PATH // TYPE_SOURCE_LUCENE_VERSION = $TYPE_SOURCE_LUCENE_VERSION"

  # END - Plugin-PrepareComp
  #---------------------

  if [ "$TYPE_SOURCE_LUCENE" == "local" ]; then
    OPWD="$(pwd)"
    cd "$(dirname "localrun/lucene-bin/bin/run")"
    if [ ! -f "$BASE_PWD/.lucenePid" ]; then
      verbosePrint "nohup "./$(basename "localrun/lucene-bin/bin/run")" 1>>"$BASE_PWD/localrun/lucene.log" 2>>"$BASE_PWD/localrun/lucene.log" &"
      nohup "./$(basename "localrun/lucene-bin/bin/run")" 1>>"$BASE_PWD/localrun/lucene.log" 2>>"$BASE_PWD/localrun/lucene.log" &
      javaPIDlucene=$!
      echo "$javaPIDlucene" >"$BASE_PWD/.lucenePid"
    else
      javaPIDlucene=$(<"$BASE_PWD/.lucenePid")
      echo "Reusing already running instance $javaPIDlucene"
    fi
    cd "$OPWD"
  fi
  if [ "$TYPE_SOURCE_LUCENE" == "docker" ]; then
    #if [ -f "$BASE_PWD/.lucenePid" ] && [ "$(<"$BASE_PWD/.lucenePid")" == "download" ]; then
    #  echo "node running but started from different source type"
    #  exit 1
    #fi
    if [ ! -f "$BASE_PWD/.lucenePid" ]; then
      startDockerNetwork

      if [ "$TYPE_SOURCE_CDB" == "docker" ]; then
        REPLVAR_LUCENEBUILD_CDB="cdb"
      elif [ "$TYPE_SOURCE_CDB" == "local" ]; then
        REPLVAR_LUCENEBUILD_CDB="host.docker.internal"
      fi

      mkdir -p localrun/1d77d2c1

      cat <<EOT1d77d2c1 >localrun/1d77d2c1/couchdb-lucene.ini

[lucene]

# The output directory for Lucene indexes.

dir=indexes



# The local host name that couchdb-lucene binds to

host=0.0.0.0



# The port that couchdb-lucene binds to.

port=5985



# Timeout for requests in milliseconds.

timeout=10000



# Timeout for changes requests.

# changes_timeout=60000



# Default limit for search results

limit=25



# Allow leading wildcard?

allowLeadingWildcard=true



# couchdb server mappings



[local]

url=http://$REPLVAR_LUCENEBUILD_CDB:5984/



EOT1d77d2c1

      verbosePrint "docker run --rm -d -p 5985:5985 -m 150M --net=linkynet --name=lucene $ADD_HOST_INTERNAL -v "$(pwd)/localrun/1d77d2c1:/home/node/exec_env/localrun/lucene-bin/conf"  -v "$(pwd)":/home/node/exec_env -w /home/node/exec_env adoptopenjdk/openjdk11-openj9:$TYPE_SOURCE_LUCENE_VERSION /bin/bash -c ./localrun/lucene-bin/bin/run"
      dockerContainerIDlucene=$(docker run --rm -d -p 5985:5985 \
        -m 150M \
        --net=linkynet --name=lucene $ADD_HOST_INTERNAL \
        -v "$(pwd)/localrun/1d77d2c1:/home/node/exec_env/localrun/lucene-bin/conf" \
        -v "$(pwd)":/home/node/exec_env -w /home/node/exec_env adoptopenjdk/openjdk11-openj9:$TYPE_SOURCE_LUCENE_VERSION /bin/bash -c ./localrun/lucene-bin/bin/run)
      echo "$dockerContainerIDlucene" >"$BASE_PWD/.lucenePid"
    else
      dockerContainerIDlucene=$(<"$BASE_PWD/.lucenePid")
      echo "Reusing already running instance $dockerContainerIDlucene"
    fi
  fi

fi

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# CouchdbPlugin // cdb
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
verbosePrint "CouchdbPlugin // cdb"

if [ "$START_CDB" = "YES" ]; then

  #---------------------
  # START - Plugin-PrepareComp

  IFS=',' read -r -a array <<<"$TYPE_SOURCE"
  for typeSourceElement in "${array[@]}"; do
    IFS=: read comp type pathOrVersion <<<"$typeSourceElement"

    if [ "$comp" == "cdb" ]; then
      TYPE_SOURCE_CDB=$type
      if [ "$TYPE_SOURCE_CDB" == "local" ]; then
        TYPE_SOURCE_CDB_PATH=$pathOrVersion
      else
        TYPE_SOURCE_CDB_VERSION=$pathOrVersion
      fi
    fi

  done

  if [ "$TYPE_SOURCE_CDB" == "docker" ]; then
    if [ -z "$TYPE_SOURCE_CDB_VERSION" ]; then
      TYPE_SOURCE_CDB_VERSION=1.7
    fi

  fi

  verbosePrint "TYPE_SOURCE_CDB = $TYPE_SOURCE_CDB // TYPE_SOURCE_CDB_PATH = $TYPE_SOURCE_CDB_PATH // TYPE_SOURCE_CDB_VERSION = $TYPE_SOURCE_CDB_VERSION"

  # END - Plugin-PrepareComp
  #---------------------

  if [ "$TYPE_SOURCE_CDB" == "docker" ]; then
    if [ ! -f ".cdbPid" ]; then
      startDockerNetwork

      if [ "$TYPE_SOURCE_LUCENE" == "docker" ]; then
        REPLVAR_CDB_LUCENE="lucene"
      elif [ "$TYPE_SOURCE_LUCENE" == "local" ]; then
        REPLVAR_CDB_LUCENE="host.docker.internal"
      fi

      mkdir -p localrun/fe3cdbbf

      cat <<EOTfe3cdbbf >localrun/fe3cdbbf/local.ini

[httpd_global_handlers]

_fti={couch_httpd_proxy, handle_proxy_req, <<"http://$REPLVAR_CDB_LUCENE:5985">>}

EOTfe3cdbbf

      verbosePrint "docker run --rm -d -p 5984:5984 -m 200M --net=linkynet --name=cdb $ADD_HOST_INTERNAL  -v "$(pwd)/localrun/fe3cdbbf:/usr/local/etc/couchdb/local.d" couchdb:$TYPE_SOURCE_CDB_VERSION"
      dockerContainerIDcdb=$(docker run --rm -d -p 5984:5984 \
        -m 200M \
        --net=linkynet --name=cdb $ADD_HOST_INTERNAL \
        -v "$(pwd)/localrun/fe3cdbbf:/usr/local/etc/couchdb/local.d" couchdb:$TYPE_SOURCE_CDB_VERSION)
      echo "$dockerContainerIDcdb" >.cdbPid
    else
      dockerContainerIDcdb=$(<.cdbPid)
      echo "Reusing already running instance $dockerContainerIDcdb"
    fi
  fi
  if [ "$TYPE_SOURCE_CDB" == "local" ]; then
    if [ -f ".cdbPid" ]; then
      echo "couchdb cdb running but started from different source type"
      exit 1
    fi
  fi

  while [ "$(curl --write-out %{http_code} --silent --output /dev/null http://localhost:5984)" != "200" ]; do
    echo "waiting for couchdb..."
    sleep 1
  done

  if [[ "$(curl -s http://localhost:5984/linky)" =~ .*"error".*"not_found".* ]]; then
    curl -X PUT http://localhost:5984/linky

    curl -X POST -H "Content-Type: application/json" -d @build/couchdb/linky/_design-asyncWait-curl.json http://localhost:5984/linky

    curl -X POST -H "Content-Type: application/json" -d @build/couchdb/linky/_design-debug-curl.json http://localhost:5984/linky

    curl -X POST -H "Content-Type: application/json" -d @build/couchdb/linky/_design-feedUpdates-curl.json http://localhost:5984/linky

    curl -X POST -H "Content-Type: application/json" -d @build/couchdb/linky/_design-hierarchy-curl.json http://localhost:5984/linky

    curl -X POST -H "Content-Type: application/json" -d @build/couchdb/linky/_design-links-curl.json http://localhost:5984/linky

    curl -X POST -H "Content-Type: application/json" -d @build/couchdb/linky/_design-lucene-curl.json http://localhost:5984/linky

    curl -X POST -H "Content-Type: application/json" -d @build/couchdb/linky/_design-users-curl.json http://localhost:5984/linky

    curl -X POST -H "Content-Type: application/json" -d @build/couchdb/linky/_design-visitors-curl.json http://localhost:5984/linky

  fi

  if [[ "$(curl -s http://localhost:5984/linky_archive)" =~ .*"error".*"not_found".* ]]; then
    curl -X PUT http://localhost:5984/linky_archive

    curl -X POST -H "Content-Type: application/json" -d @build/couchdb/linky-archive/_design-archives-curl.json http://localhost:5984/linky_archive

  fi

fi

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# NodePlugin // linky
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
verbosePrint "NodePlugin // linky"

if [ "$START_LINKY" = "YES" ]; then

  #---------------------
  # START - Plugin-PrepareComp

  IFS=',' read -r -a array <<<"$TYPE_SOURCE"
  for typeSourceElement in "${array[@]}"; do
    IFS=: read comp type pathOrVersion <<<"$typeSourceElement"

    if [ "$comp" == "linky" ]; then
      TYPE_SOURCE_LINKY=$type
      if [ "$TYPE_SOURCE_LINKY" == "local" ]; then
        TYPE_SOURCE_LINKY_PATH=$pathOrVersion
      else
        TYPE_SOURCE_LINKY_VERSION=$pathOrVersion
      fi
    fi

  done

  if [ "$TYPE_SOURCE_LINKY" == "docker" ]; then
    if [ -z "$TYPE_SOURCE_LINKY_VERSION" ]; then
      TYPE_SOURCE_LINKY_VERSION=latest
    fi

  fi

  verbosePrint "TYPE_SOURCE_LINKY = $TYPE_SOURCE_LINKY // TYPE_SOURCE_LINKY_PATH = $TYPE_SOURCE_LINKY_PATH // TYPE_SOURCE_LINKY_VERSION = $TYPE_SOURCE_LINKY_VERSION"

  # END - Plugin-PrepareComp
  #---------------------

  f_build() {
    verbosePrint "npm i --save-prod"

    npm i --save-prod

  }
  if [ "$SKIP_BUILD" != "YES" ]; then
    if [ -n "$CLEAN" ]; then
      verbosePrint "rm -rf node_modules/"
      rm -rf node_modules/
    fi
    f_build
  fi

  if [ "$TYPE_SOURCE_LINKY" == "docker" ]; then
    #if [ -f ".linkyPid" ] && [ "$(<.linkyPid)" == "download" ]; then
    #  echo "node running but started from different source type"
    #  exit 1
    #fi
    if [ ! -f ".linkyPid" ]; then
      startDockerNetwork

      if [ "$TYPE_SOURCE_CDB" == "docker" ]; then
        REPLVAR_LINKY_CDB="cdb"
      elif [ "$TYPE_SOURCE_CDB" == "local" ]; then
        REPLVAR_LINKY_CDB="host.docker.internal"
      fi

      mkdir -p localrun/8337186e

      cat <<EOT8337186e >localrun/8337186e/linky.properties

[build]



login.userpass=true

login.oauth=false



[server]



jwt.secret=foobar

jwt.expiresIn=24h

jwt.httpsOnly=false



archive.protocol=

archive.domain=



log.path=./winston-config.json

log.access.targetDir=./

favicon.cachePath=/tmp

archive.cachePath=/tmp

http.userAgent=Archive UserAgent



#headers.dynamicPages.1=Cache-Control: no-store, must-revalidate

#headers.dynamicPages.2=Expires: 0



auth.redirectUri=



db.protocol=http

db.host=$REPLVAR_LINKY_CDB

db.port=5984

db.name=linky

db.archiveName=linky_archive

db.rejectUnauthorized=true

db.user=

db.password=



# https://console.developers.google.com/apis/credentials

# https://developers.google.com/identity/protocols/OpenIDConnect#authenticatingtheuser

auth.google.oauth=openid

auth.google.scope=profile openid

auth.google.clientId=

auth.google.clientSecret=

auth.google.openIdConfigUri=https://accounts.google.com/.well-known/openid-configuration



# https://developer.yahoo.com/apps/???/

# https://developer.yahoo.com/oauth2/guide/openid_connect/getting_started.html#menu

auth.yahoo.oauth=openid

auth.yahoo.scope=openid

auth.yahoo.clientId=

auth.yahoo.clientSecret=

auth.yahoo.openIdConfigUri=https://login.yahoo.com/.well-known/openid-configuration



# https://developers.facebook.com/apps/?????/dashboard/

# https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow

auth.facebook.oauth=2

auth.facebook.scope=public_profile

auth.facebook.clientId=

auth.facebook.clientSecret=

auth.facebook.authUri=https://www.facebook.com/v2.9/dialog/oauth

auth.facebook.tokenUri=https://graph.facebook.com/v2.9/oauth/access_token

auth.facebook.userUri=https://graph.facebook.com/me



# https://github.com/settings/developers

# https://developer.github.com/v3/oauth/

auth.github.oauth=2

auth.github.scope=

auth.github.clientId=

auth.github.clientSecret=

auth.github.authUri=https://github.com/login/oauth/authorize

auth.github.tokenUri=https://github.com/login/oauth/access_token

auth.github.userUri=https://api.github.com/user



# https://www.linkedin.com/developer/apps

# https://developer.linkedin.com/docs/oauth2

auth.linkedin.oauth=2

auth.linkedin.scope=r_basicprofile

auth.linkedin.clientId=

auth.linkedin.clientSecret=

auth.linkedin.authUri=https://www.linkedin.com/oauth/v2/authorization

auth.linkedin.tokenUri=https://www.linkedin.com/oauth/v2/accessToken

auth.linkedin.userUri=https://api.linkedin.com/v1/people/~?format=json



# https://apps.twitter.com

# https://dev.twitter.com/web/sign-in/implementing

auth.twitter.oauth=1

auth.twitter.clientId=

auth.twitter.clientSecret=

auth.twitter.requestUri=https://api.twitter.com/oauth/request_token

auth.twitter.authUri=https://api.twitter.com/oauth/authenticate

auth.twitter.tokenUri=https://api.twitter.com/oauth/access_token

auth.twitter.userUri=https://api.twitter.com/1.1/account/verify_credentials



# https://bitbucket.org/account/user/????/api

# https://confluence.atlassian.com/bitbucket/oauth-on-bitbucket-cloud-238027431.html

# https://developer.atlassian.com/bitbucket/api/2/reference/resource/user/emails

auth.bitbucket.oauth=2

auth.bitbucket.scope=email

auth.bitbucket.clientId=

auth.bitbucket.clientSecret=

auth.bitbucket.authUri=https://bitbucket.org/site/oauth2/authorize

auth.bitbucket.tokenUri=https://bitbucket.org/site/oauth2/access_token

auth.bitbucket.userUri=https://api.bitbucket.org/2.0/user

auth.bitbucket.userIdKey=account_id



# https://apps.dev.microsoft.com/?mkt=en-us#/appList

# https://msdn.microsoft.com/en-us/library/hh243647.aspx

auth.windowslive.oauth=2

auth.windowslive.scope=User.Read

auth.windowslive.clientId=

auth.windowslive.clientSecret=

auth.windowslive.authUri=https://login.live.com/oauth20_authorize.srf

auth.windowslive.tokenUri=https://login.live.com/oauth20_token.srf

auth.windowslive.userUri=https://graph.microsoft.com/beta/me



# https://dev.battle.net/apps/mykeys

# https://dev.battle.net/io-docs

auth.blizzard-eu.oauth=2

auth.blizzard-eu.scope=wow.profile sc2.profile

auth.blizzard-eu.clientId=

auth.blizzard-eu.clientSecret=

auth.blizzard-eu.authUri=https://eu.battle.net/oauth/authorize

auth.blizzard-eu.tokenUri=https://eu.battle.net/oauth/token

auth.blizzard-eu.userUri=https://eu.api.battle.net/account/user



# https://www.reddit.com/prefs/apps

# https://github.com/reddit/reddit/wiki/OAuth2

auth.reddit.oauth=2

auth.reddit.scope=identity

auth.reddit.clientId=

auth.reddit.clientSecret=

auth.reddit.authUri=https://www.reddit.com/api/v1/authorize

auth.reddit.tokenUri=https://www.reddit.com/api/v1/access_token

auth.reddit.userUri=https://oauth.reddit.com/api/v1/me

auth.reddit.refreshUri=https://www.reddit.com/api/v1/access_token



EOT8337186e

      verbosePrint "docker run --rm -d -p 8080:8080 -m 200M --net=linkynet --name=linky $ADD_HOST_INTERNAL -v "$(pwd)/localrun/8337186e:/tmp/8337186e" -e NODE_ENV="development" -e PROXY_PORT="8080" -e PROXY_BIND="0.0.0.0" -e PORT="8080" -e BIND="0.0.0.0" -e LINKY_PROPERTIES="/tmp/8337186e/linky.properties" -v $(pwd):/home/node/exec_env -w /home/node/exec_env node:$TYPE_SOURCE_LINKY_VERSION node -r babel-register -r babel-polyfill --trace-warnings ./server/"
      dockerContainerIDlinky=$(docker run --rm -d -p 8080:8080 \
        -m 200M \
        --net=linkynet --name=linky $ADD_HOST_INTERNAL \
        -v "$(pwd)/localrun/8337186e:/tmp/8337186e" -e NODE_ENV="development" -e PROXY_PORT="8080" -e PROXY_BIND="0.0.0.0" -e PORT="8080" -e BIND="0.0.0.0" -e LINKY_PROPERTIES="/tmp/8337186e/linky.properties" \
        -v "$(pwd)":/home/node/exec_env -w /home/node/exec_env node:$TYPE_SOURCE_LINKY_VERSION node -r babel-register -r babel-polyfill --trace-warnings ./server/)
      echo "$dockerContainerIDlinky" >.linkyPid
    else
      dockerContainerIDlinky=$(<.linkyPid)
      echo "Reusing already running instance $dockerContainerIDlinky"
    fi
    tailCmd="docker logs -f $dockerContainerIDlinky"
  fi

  if [ "$TYPE_SOURCE_LINKY" == "local" ]; then
    #if [ -f ".linkyPid" ]; then
    #  echo "node running but started from different source type"
    #  exit 1
    #fi
    if [ ! -f ".linkyPid" ]; then
      cat <<-EOF >localrun/noint.js
      process.on( "SIGINT", function() {} );
      require('../server/');
EOF
      verbosePrint "NODE_ENV="development" PROXY_PORT="8080" PROXY_BIND="0.0.0.0" PORT="8080" BIND="0.0.0.0" node -r babel-register -r babel-polyfill --trace-warnings localrun/noint.js >localrun/noint.out 2>&1 &"

      REPLVAR_LINKY_CDB="localhost"

      mkdir -p localrun/8337186e

      cat <<EOT8337186e >localrun/8337186e/linky.properties

[build]



login.userpass=true

login.oauth=false



[server]



jwt.secret=foobar

jwt.expiresIn=24h

jwt.httpsOnly=false



archive.protocol=

archive.domain=



log.path=./winston-config.json

log.access.targetDir=./

favicon.cachePath=/tmp

archive.cachePath=/tmp

http.userAgent=Archive UserAgent



#headers.dynamicPages.1=Cache-Control: no-store, must-revalidate

#headers.dynamicPages.2=Expires: 0



auth.redirectUri=



db.protocol=http

db.host=$REPLVAR_LINKY_CDB

db.port=5984

db.name=linky

db.archiveName=linky_archive

db.rejectUnauthorized=true

db.user=

db.password=



# https://console.developers.google.com/apis/credentials

# https://developers.google.com/identity/protocols/OpenIDConnect#authenticatingtheuser

auth.google.oauth=openid

auth.google.scope=profile openid

auth.google.clientId=

auth.google.clientSecret=

auth.google.openIdConfigUri=https://accounts.google.com/.well-known/openid-configuration



# https://developer.yahoo.com/apps/???/

# https://developer.yahoo.com/oauth2/guide/openid_connect/getting_started.html#menu

auth.yahoo.oauth=openid

auth.yahoo.scope=openid

auth.yahoo.clientId=

auth.yahoo.clientSecret=

auth.yahoo.openIdConfigUri=https://login.yahoo.com/.well-known/openid-configuration



# https://developers.facebook.com/apps/?????/dashboard/

# https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow

auth.facebook.oauth=2

auth.facebook.scope=public_profile

auth.facebook.clientId=

auth.facebook.clientSecret=

auth.facebook.authUri=https://www.facebook.com/v2.9/dialog/oauth

auth.facebook.tokenUri=https://graph.facebook.com/v2.9/oauth/access_token

auth.facebook.userUri=https://graph.facebook.com/me



# https://github.com/settings/developers

# https://developer.github.com/v3/oauth/

auth.github.oauth=2

auth.github.scope=

auth.github.clientId=

auth.github.clientSecret=

auth.github.authUri=https://github.com/login/oauth/authorize

auth.github.tokenUri=https://github.com/login/oauth/access_token

auth.github.userUri=https://api.github.com/user



# https://www.linkedin.com/developer/apps

# https://developer.linkedin.com/docs/oauth2

auth.linkedin.oauth=2

auth.linkedin.scope=r_basicprofile

auth.linkedin.clientId=

auth.linkedin.clientSecret=

auth.linkedin.authUri=https://www.linkedin.com/oauth/v2/authorization

auth.linkedin.tokenUri=https://www.linkedin.com/oauth/v2/accessToken

auth.linkedin.userUri=https://api.linkedin.com/v1/people/~?format=json



# https://apps.twitter.com

# https://dev.twitter.com/web/sign-in/implementing

auth.twitter.oauth=1

auth.twitter.clientId=

auth.twitter.clientSecret=

auth.twitter.requestUri=https://api.twitter.com/oauth/request_token

auth.twitter.authUri=https://api.twitter.com/oauth/authenticate

auth.twitter.tokenUri=https://api.twitter.com/oauth/access_token

auth.twitter.userUri=https://api.twitter.com/1.1/account/verify_credentials



# https://bitbucket.org/account/user/????/api

# https://confluence.atlassian.com/bitbucket/oauth-on-bitbucket-cloud-238027431.html

# https://developer.atlassian.com/bitbucket/api/2/reference/resource/user/emails

auth.bitbucket.oauth=2

auth.bitbucket.scope=email

auth.bitbucket.clientId=

auth.bitbucket.clientSecret=

auth.bitbucket.authUri=https://bitbucket.org/site/oauth2/authorize

auth.bitbucket.tokenUri=https://bitbucket.org/site/oauth2/access_token

auth.bitbucket.userUri=https://api.bitbucket.org/2.0/user

auth.bitbucket.userIdKey=account_id



# https://apps.dev.microsoft.com/?mkt=en-us#/appList

# https://msdn.microsoft.com/en-us/library/hh243647.aspx

auth.windowslive.oauth=2

auth.windowslive.scope=User.Read

auth.windowslive.clientId=

auth.windowslive.clientSecret=

auth.windowslive.authUri=https://login.live.com/oauth20_authorize.srf

auth.windowslive.tokenUri=https://login.live.com/oauth20_token.srf

auth.windowslive.userUri=https://graph.microsoft.com/beta/me



# https://dev.battle.net/apps/mykeys

# https://dev.battle.net/io-docs

auth.blizzard-eu.oauth=2

auth.blizzard-eu.scope=wow.profile sc2.profile

auth.blizzard-eu.clientId=

auth.blizzard-eu.clientSecret=

auth.blizzard-eu.authUri=https://eu.battle.net/oauth/authorize

auth.blizzard-eu.tokenUri=https://eu.battle.net/oauth/token

auth.blizzard-eu.userUri=https://eu.api.battle.net/account/user



# https://www.reddit.com/prefs/apps

# https://github.com/reddit/reddit/wiki/OAuth2

auth.reddit.oauth=2

auth.reddit.scope=identity

auth.reddit.clientId=

auth.reddit.clientSecret=

auth.reddit.authUri=https://www.reddit.com/api/v1/authorize

auth.reddit.tokenUri=https://www.reddit.com/api/v1/access_token

auth.reddit.userUri=https://oauth.reddit.com/api/v1/me

auth.reddit.refreshUri=https://www.reddit.com/api/v1/access_token



EOT8337186e

      export LINKY_PROPERTIES="localrun/8337186e/linky.properties"

      NODE_ENV="development" PROXY_PORT="8080" PROXY_BIND="0.0.0.0" PORT="8080" BIND="0.0.0.0" node -r babel-register -r babel-polyfill --trace-warnings localrun/noint.js >localrun/noint.out 2>&1 &
      processIdlinky=$!
      echo "$processIdlinky" >.linkyPid
    else
      processIdlinky=$(<.linkyPid)
      echo "Reusing already running instance $processIdlinky"
    fi
    tailCmd="tail -f localrun/noint.out"
  fi

fi

#---------------------
# START - WaitBuilder

# waiting for ctrl-c
echo "*************************************************************"
echo "**** SCRIPT COMPLETED, STARTUP IN PROGRESS ******************"
if [ "$TAIL" == "YES" ]; then
  echo "http://localhost:8080"
  echo "**** now tailing log: $tailCmd"
  $tailCmd
else
  echo "http://localhost:8080"
  echo "$tailCmd"
  echo "<return> to rebuild, ctrl-c to stop lucene, cdb, linky"
  while true; do
    read </dev/tty
    f_build
    f_deploy
  done
fi

# END - WaitBuilder
#---------------------


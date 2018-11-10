#!/usr/bin/env bash

trap cleanup 2
set -e



#------------
# FunctionsBuilder
#------------



	jdk_version() {
		
  # returns the JDK version.
  # 8 for 1.8.0_nn, 9 for 9-ea etc, and "no_java" for undetected
  # from https://stackoverflow.com/questions/7334754/correct-way-to-check-java-version-from-bash-script
  local result
  local java_cmd
  if [[ -n $(type -p java) ]]
  then
    java_cmd=java
  elif [[ (-n "$JAVA_HOME") && (-x "$JAVA_HOME/bin/java") ]]
  then
    java_cmd="$JAVA_HOME/bin/java"
  fi
  local IFS=$'\n'
  # remove \r for Cygwin
  local lines=$("$java_cmd" -Xms32M -Xmx32M -version 2>&1 | tr '\r' '\n')
  if [[ -z $java_cmd ]]
  then
    result=no_java
  else
    for line in $lines; do
      if [[ (-z $result) && ($line = *"version \""*) ]]
      then
        local ver=$(echo $line | sed -e 's/.*version "\(.*\)"\(.*\)/\1/; 1q')
        # on macOS, sed doesn't support '?'
        if [[ $ver = "1."* ]]
        then
          result=$(echo $ver | sed -e 's/1\.\([0-9]*\)\(.*\)/\1/; 1q')
        else
          result=$(echo $ver | sed -e 's/\([0-9]*\)\(.*\)/\1/; 1q')
        fi
      fi
    done
  fi
  echo "$result"

	}







#------------
# CleanupBuilder
#------------


cleanup()
{
  echo "****************************************************************"
  echo "Stopping software .....please wait...."
  echo "****************************************************************"

  ALL_COMPONENTS=(java couchdb node)
  for componentToStop in "${ALL_COMPONENTS[@]}"; do
    IFS=',' read -r -a keepRunningArray <<< "$KEEP_RUNNING"
    componentFoundToKeepRunning=0
    for keepRunningToFindeElement in "${keepRunningArray[@]}"; do
      if [ "$componentToStop" == "$keepRunningToFindeElement" ]; then
        echo "Not stopping $componentToStop!"
        componentFoundToKeepRunning=1
      fi
    done
    if [ "$componentFoundToKeepRunning" -eq 0 ]; then
      
      if [ "$componentToStop" == "java" ]; then
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
      
      if [ "$componentToStop" == "couchdb" ]; then
        echo "Stopping $componentToStop ..."
        
        if [ "$TYPE_SOURCE_CDB" == "docker" ]; then
         docker rm -f $dockerContainerIDcdb
         rm -f .cdbPid
        fi
        
      fi
      
      if [ "$componentToStop" == "node" ]; then
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
  done

  exit 0
}







#------------
# OptionsBuilder
#------------


usage="$(basename "$0") - Builds, deploys and run ${name}
where:
  -h                         show this help text
  -s                         skip any build
  -c [all|build]             clean local run directory, when a build is scheduled for execution it also does a full build
  -k [component]             keep comma sperarated list of components running
  -t [component:type:[path|version]] run component inside [docker] container, [download] component (default) or [local] use installed component from path
  -V                         enable Verbose
  -v                         start VirtualBox via vagrant, install all dependencies, ssh into the VM and run
  -b local|docker:version    build locally (default) or within a maven image on docker, the default image is 3-jdk-11
  -j version                 macOS only: set/overwrite JAVA_HOME to a specific version, needs to be in format for /usr/libexec/java_home
  -f                         tail the nodejs log at the end
  

Details:
 -b docker:[3-jdk-8|3-jdk-9|3-jdk-10|3-jdk-11] #do a docker based build, uses maven:3-jdk-11 image
 -b local #do a local build, would respect -j
 -j version #can use any locally installed JDK, see /usr/libexec/java_home -V
 -t cdb:local #reuse a local, running CouchDB installation, does not start/stop this CouchDB
 -t cdb:docker:[1.7|2] #start docker image couchdb:X
 -t linky:local #reuse a local node installation
 -t linky:docker:[6|8|10] #start docker image node:X

"

cd "$(cd "$(dirname "$0")";pwd -P)"
BASE_PWD=$(pwd)

BUILD=local
while getopts ':hsc:k:t:Vvb:j:f' option; do
  case "$option" in
    h) echo "$usage"
       exit;;
    s) SKIP_BUILD=YES;;
    c) 
       CLEAN=$OPTARG
       if [ "$CLEAN" != "all" -a "$CLEAN" != "build" ]; then
         echo "Illegal -c parameter" && exit 1
       fi
       ;;
    k) KEEP_RUNNING=$OPTARG;;
    t) TYPE_SOURCE=$OPTARG;;
    V) VERBOSE=YES;;

    v) VAGRANT=YES;;

    b) BUILD=$OPTARG;;

    j) JAVA_VERSION=$OPTARG;;

    f) TAIL=YES;;

    :) printf "missing argument for -%s\\n" "$OPTARG" >&2
       echo "$usage" >&2
       exit 1;;
   \\?) printf "illegal option: -%s\\n" "$OPTARG" >&2
       echo "$usage" >&2
       exit 1;;
  esac
done
shift $((OPTIND - 1))
TYPE_PARAM="$1"






#------------
# DependencycheckBuilder
#------------

mvn --version 1>/dev/null || exit 1; 
java -version 2>/dev/null || exit 1; 
docker --version 1>/dev/null || exit 1; 
node --version 1>/dev/null || exit 1; 
npm --version 1>/dev/null || exit 1; 




# clean if requested
if [ -n "$CLEAN" ]; then
  if [ "$CLEAN" == "all" ]; then
    if [ "$VERBOSE" == "YES" ]; then echo "rm -rf localrun"; fi
    rm -rf localrun
  fi
  

#------------
# CleanBuilder
#------------




fi



#------------
# GlobalVariablesBuilder
#------------


      if [ "$VERBOSE" == "YES" ]; then echo "DEFAULT: TYPE_SOURCE_LUCENE=local"; fi
      TYPE_SOURCE_LUCENE=local
    

      if [ "$VERBOSE" == "YES" ]; then echo "DEFAULT: TYPE_SOURCE_CDB=docker"; fi
      TYPE_SOURCE_CDB=docker
    

      if [ "$VERBOSE" == "YES" ]; then echo "DEFAULT: TYPE_SOURCE_LINKY=local"; fi
      TYPE_SOURCE_LINKY=local
    



mkdir -p localrun



#------------
# PrepareBuilder
#------------



if [ "$VAGRANT" == "YES" -a "$VAGRANT_IGNORE" != "YES" ]; then
  mkdir -p localrun
  cd localrun
  cat <<-EOF > Vagrantfile
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/xenial64"
  config.vm.network "forwarded_port", guest: 8080, host: 8080
  config.vm.synced_folder "../", "/share_host"
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
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
    echo "...then browse to http://localhost:8080/XXXX"
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




if [ "$(uname)" == "Darwin" ]; then 
  if [ -n "$JAVA_VERSION" ]; then
    export JAVA_HOME=$(/usr/libexec/java_home -v $JAVA_VERSION)
  fi
fi







#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# MvnPlugin // lucenebuild
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
if [ -n "$VERBOSE" ]; then echo "MvnPlugin // lucenebuild"; fi




#------------
# Plugin-PrepareComp
#------------


  mkdir -p localrun/lucene


    OPWD="$(pwd)"
    cd "localrun/lucene"
          






#------------
# Plugin-GetSource
#------------



          if [ ! -d ".git" ]; then
            git clone "https://github.com/rnewson/couchdb-lucene" .
          else
            git pull
          fi
        






#------------
# Plugin-PreBuild
#------------







#------------
# Plugin-Build
#------------





if [ "$BUILD" == "local" ]; then
  f_build() {
    if [ -n "$VERBOSE" ]; then echo "pwd=$(pwd)"; echo "mvn $MVN_CLEAN $MVN_OPTS package assembly:single"; fi
    sed -i.bak 's/allowLeadingWildcard=false/allowLeadingWildcard=true/g' src/main/resources/couchdb-lucene.ini
    
    mvn $MVN_CLEAN $MVN_OPTS package assembly:single
    mv -f src/main/resources/couchdb-lucene.ini.bak src/main/resources/couchdb-lucene.ini
mkdir -p "$BASE_PWD/localrun/lucene-bin"
tar -xvf target/*.tar.gz --strip 1 -C "$BASE_PWD/localrun/lucene-bin"
  }
fi

if [[ "$BUILD" == docker* ]]; then
  IFS=: read mainType dockerVersion <<< "$BUILD"
  if [ -z "$dockerVersion" ]; then
    dockerVersion="3-jdk-11"
  fi

  
  dockerImage=maven
  

  f_build() {
    if [ -n "$VERBOSE" ]; then echo "pwd=$(pwd)"; echo "docker run --rm -v $(pwd):/usr/src/build -v $(pwd)/localrun/.m2:/root/.m2 -w /usr/src/build $dockerImage:$dockerVersion mvn $MVN_CLEAN $MVN_OPTS package assembly:single"; fi
    sed -i.bak 's/allowLeadingWildcard=false/allowLeadingWildcard=true/g' src/main/resources/couchdb-lucene.ini
    docker run --rm  -v "$(pwd)":/usr/src/build -v "$(pwd)/localrun/.m2":/root/.m2 -w /usr/src/build $dockerImage:$dockerVersion mvn $MVN_CLEAN $MVN_OPTS package assembly:single
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
fi  



#------------
# Plugin-PostBuild
#------------







#------------
# Plugin-PreStart
#------------







#------------
# Plugin-Start
#------------







#------------
# Plugin-PostStart
#------------







#------------
# Plugin-LeaveComp
#------------


  cd "$OPWD"






#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# JavaPlugin // lucene
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
if [ -n "$VERBOSE" ]; then echo "JavaPlugin // lucene"; fi




#------------
# Plugin-PrepareComp
#------------




IFS=',' read -r -a array <<< "$TYPE_SOURCE"
for typeSourceElement in "${array[@]}"; do
  IFS=: read comp type pathOrVersion <<< "$typeSourceElement"

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
    TYPE_SOURCE_LUCENE_VERSION=10-jre
  fi
    
fi



if [ "$VERBOSE" == "YES" ]; then
  echo "TYPE_SOURCE_LUCENE = $TYPE_SOURCE_LUCENE // TYPE_SOURCE_LUCENE_PATH = $TYPE_SOURCE_LUCENE_PATH // TYPE_SOURCE_LUCENE_VERSION = $TYPE_SOURCE_LUCENE_VERSION"
fi







#------------
# Plugin-GetSource
#------------







#------------
# Plugin-PreBuild
#------------







#------------
# Plugin-Build
#------------







#------------
# Plugin-PostBuild
#------------







#------------
# Plugin-PreStart
#------------







#------------
# Plugin-Start
#------------





if [ "$TYPE_SOURCE_LUCENE" == "local" ]; then
	OPWD="$(pwd)"
	cd "$(dirname "localrun/lucene-bin/bin/run")"
	if [ ! -f "$BASE_PWD/.lucenePid" ]; then
	  if [ "$VERBOSE" == "YES" ]; then echo "nohup "./$(basename "localrun/lucene-bin/bin/run")" 1>>"$BASE_PWD/localrun/lucene.log" 2>>"$BASE_PWD/localrun/lucene.log" &"; fi
	   nohup "./$(basename "localrun/lucene-bin/bin/run")" 1>>"$BASE_PWD/localrun/lucene.log" 2>>"$BASE_PWD/localrun/lucene.log" &
	  javaPIDlucene=$!
	  echo "$javaPIDlucene">"$BASE_PWD/.lucenePid"
	else 
	  javaPIDlucene=$(<"$BASE_PWD/.lucenePid")
	fi
	cd "$OPWD"
fi
if [ "$TYPE_SOURCE_LUCENE" == "docker" ]; then
	#if [ -f "$BASE_PWD/.lucenePid" ] && [ "$(<"$BASE_PWD/.lucenePid")" == "download" ]; then
	#  echo "node running but started from different source type"
	#  exit 1
	#fi
	if [ ! -f "$BASE_PWD/.lucenePid" ]; then
	  
	  if [ -n "$VERBOSE" ]; then echo "docker run --rm -d $dockerJavaExtRef -p 5985:5985   -v "$(pwd)":/home/node/exec_env -w /home/node/exec_env openjdk:$TYPE_SOURCE_LUCENE_VERSION /bin/bash -c ./localrun/lucene-bin/bin/run"; fi
	  dockerContainerIDlucene=$(docker run --rm -d $dockerJavaExtRef -p 5985:5985 \
	        \
	       \
	      -v "$(pwd)":/home/node/exec_env -w /home/node/exec_env openjdk:$TYPE_SOURCE_LUCENE_VERSION /bin/bash -c ./localrun/lucene-bin/bin/run)
	  echo "$dockerContainerIDlucene">"$BASE_PWD/.lucenePid"
	else
	  dockerContainerIDlucene=$(<"$BASE_PWD/.lucenePid")
	fi
fi



#------------
# Plugin-PostStart
#------------







#------------
# Plugin-LeaveComp
#------------







#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# CouchdbPlugin // cdb
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
if [ -n "$VERBOSE" ]; then echo "CouchdbPlugin // cdb"; fi




#------------
# Plugin-PrepareComp
#------------




IFS=',' read -r -a array <<< "$TYPE_SOURCE"
for typeSourceElement in "${array[@]}"; do
  IFS=: read comp type pathOrVersion <<< "$typeSourceElement"

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



if [ "$VERBOSE" == "YES" ]; then
  echo "TYPE_SOURCE_CDB = $TYPE_SOURCE_CDB // TYPE_SOURCE_CDB_PATH = $TYPE_SOURCE_CDB_PATH // TYPE_SOURCE_CDB_VERSION = $TYPE_SOURCE_CDB_VERSION"
fi







#------------
# Plugin-GetSource
#------------







#------------
# Plugin-PreBuild
#------------







#------------
# Plugin-Build
#------------







#------------
# Plugin-PostBuild
#------------







#------------
# Plugin-PreStart
#------------







#------------
# Plugin-Start
#------------





if [ "$TYPE_SOURCE_CDB" == "docker" ]; then
  # run in docker
  if [ ! -f ".cdbPid" ]; then
    mkdir -p localrun/fe3cdbbf


if [ "$TYPE_SOURCE_LUCENE" == "docker" ]; then
  dockerCouchdbExtRef="--link $dockerContainerIDlucene"
  
  REPLVAR_fti="{couch_httpd_proxy, handle_proxy_req, <<\"http://$dockerContainerIDlucene:5985\">>}"
  
elif [ "$TYPE_SOURCE_LUCENE" == "local" ]; then
  if [ "$(uname)" != "Linux" ]; then 
    
    REPLVAR_fti="{couch_httpd_proxy, handle_proxy_req, <<\"http://host.docker.internal:5985\">>}"
    
  else 
    dockerCouchdbExtRef="--net=host"
  fi
fi



mkdir -p localrun/fe3cdbbf

cat <<EOTfe3cdbbf > localrun/fe3cdbbf/local.ini

[httpd_global_handlers]

_fti=$REPLVAR_fti


EOTfe3cdbbf


    if [ "$VERBOSE" == "YES" ]; then echo "docker run --rm -d -p 5984:5984 $dockerCouchdbExtRef  -v "$(pwd)/localrun/fe3cdbbf:/usr/local/etc/couchdb/local.d" couchdb:$TYPE_SOURCE_CDB_VERSION"; fi
    dockerContainerIDcdb=$(docker run --rm -d -p 5984:5984 $dockerCouchdbExtRef \
       -v "$(pwd)/localrun/fe3cdbbf:/usr/local/etc/couchdb/local.d" couchdb:$TYPE_SOURCE_CDB_VERSION)
    echo "$dockerContainerIDcdb">.cdbPid
  else
    dockerContainerIDcdb=$(<.cdbPid)
  fi
fi
if [ "$TYPE_SOURCE_CDB" == "local" ]; then
  if [ -f ".cdbPid" ]; then
    echo "couchdb cdb running but started from different source type"
    exit 1
  fi
fi



#------------
# Plugin-PostStart
#------------





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





#------------
# Plugin-LeaveComp
#------------







#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# NodePlugin // linky
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
if [ -n "$VERBOSE" ]; then echo "NodePlugin // linky"; fi




#------------
# Plugin-PrepareComp
#------------




IFS=',' read -r -a array <<< "$TYPE_SOURCE"
for typeSourceElement in "${array[@]}"; do
  IFS=: read comp type pathOrVersion <<< "$typeSourceElement"

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
    TYPE_SOURCE_LINKY_VERSION=10
  fi
    
fi



if [ "$VERBOSE" == "YES" ]; then
  echo "TYPE_SOURCE_LINKY = $TYPE_SOURCE_LINKY // TYPE_SOURCE_LINKY_PATH = $TYPE_SOURCE_LINKY_PATH // TYPE_SOURCE_LINKY_VERSION = $TYPE_SOURCE_LINKY_VERSION"
fi







#------------
# Plugin-GetSource
#------------







#------------
# Plugin-PreBuild
#------------







#------------
# Plugin-Build
#------------





f_build() {
  if [ "$VERBOSE" == "YES" ]; then echo "npm i --save-prod"; fi
  
  npm i --save-prod
  
}
if [ "$SKIP_BUILD" != "YES" ]; then
  if [ -n "$CLEAN" ]; then
    if [ "$VERBOSE" == "YES" ]; then echo "rm -rf node_modules/"; fi
    rm -rf node_modules/
  fi
  f_build        
fi



#------------
# Plugin-PostBuild
#------------







#------------
# Plugin-PreStart
#------------







#------------
# Plugin-Start
#------------





if [ "$TYPE_SOURCE_LINKY" == "docker" ]; then
  #if [ -f ".linkyPid" ] && [ "$(<.linkyPid)" == "download" ]; then
  #  echo "node running but started from different source type"
  #  exit 1
  #fi
  if [ ! -f ".linkyPid" ]; then
    mkdir -p localrun/8337186e


if [ "$TYPE_SOURCE_CDB" == "docker" ]; then
  dockerNodeExtRef="--link $dockerContainerIDcdb"
  
  REPLVARdb_host="$dockerContainerIDcdb"
  
elif [ "$TYPE_SOURCE_CDB" == "local" ]; then
  if [ "$(uname)" != "Linux" ]; then 
    
    REPLVARdb_host="host.docker.internal"
    
  else 
    dockerNodeExtRef="--net=host"
  fi
fi



mkdir -p localrun/8337186e

cat <<EOT8337186e > localrun/8337186e/linky.properties

[build]



login.userpass=true

login.oauth=false



[server]



jwt.secret=foobar

jwt.expiresIn=24h

jwt.httpsOnly=false



archive.protocol=https

archive.domain=archive.linky1.com



log.path=./winston-config.json

log.access.targetDir=./

favicon.cachePath=/tmp

archive.cachePath=/tmp

http.userAgent=Archive UserAgent



#headers.dynamicPages.1=Cache-Control: no-store, must-revalidate

#headers.dynamicPages.2=Expires: 0



auth.redirectUri=



db.protocol=http

db.host=$REPLVARdb_host

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


    if [ -n "$VERBOSE" ]; then echo "docker run --rm -d $dockerNodeExtRef -p 8080:8080 -v "$(pwd)/localrun/8337186e:/tmp/8337186e" -e LINKY_PROPERTIES="/tmp/8337186e/linky.properties" -e NODE_ENV="development" -e PROXY_PORT="8080" -e PROXY_BIND="0.0.0.0" -e PORT="8080" -e BIND="0.0.0.0" -v $(pwd):/home/node/exec_env -w /home/node/exec_env node:$TYPE_SOURCE_LINKY_VERSION node -r babel-register -r babel-polyfill --trace-warnings ./server/"; fi
    dockerContainerIDlinky=$(docker run --rm -d $dockerNodeExtRef -p 8080:8080 \
        -v "$(pwd)/localrun/8337186e:/tmp/8337186e" -e LINKY_PROPERTIES="/tmp/8337186e/linky.properties" -e NODE_ENV="development" -e PROXY_PORT="8080" -e PROXY_BIND="0.0.0.0" -e PORT="8080" -e BIND="0.0.0.0" \
        -v "$(pwd)":/home/node/exec_env -w /home/node/exec_env node:$TYPE_SOURCE_LINKY_VERSION node -r babel-register -r babel-polyfill --trace-warnings ./server/)
    echo "$dockerContainerIDlinky">.linkyPid
  else
    dockerContainerIDlinky=$(<.linkyPid)
  fi
  tailCmd="docker logs -f $dockerContainerIDlinky"
fi

if [ "$TYPE_SOURCE_LINKY" == "local" ]; then
  #if [ -f ".linkyPid" ]; then
  #  echo "node running but started from different source type"
  #  exit 1
  #fi
  if [ ! -f ".linkyPid" ]; then
    cat <<-'    EOF' > localrun/noint.js
      process.on( "SIGINT", function() {} );
      require('../server/');
    EOF
    if [ -n "$VERBOSE" ]; then echo "NODE_ENV="development" PROXY_PORT="8080" PROXY_BIND="0.0.0.0" PORT="8080" BIND="0.0.0.0" node -r babel-register -r babel-polyfill --trace-warnings localrun/noint.js >localrun/noint.out 2>&1 &"; fi
    
      REPLVARdb_host="localhost"
      
mkdir -p localrun/8337186e

cat <<EOT8337186e > localrun/8337186e/linky.properties

[build]



login.userpass=true

login.oauth=false



[server]



jwt.secret=foobar

jwt.expiresIn=24h

jwt.httpsOnly=false



archive.protocol=https

archive.domain=archive.linky1.com



log.path=./winston-config.json

log.access.targetDir=./

favicon.cachePath=/tmp

archive.cachePath=/tmp

http.userAgent=Archive UserAgent



#headers.dynamicPages.1=Cache-Control: no-store, must-revalidate

#headers.dynamicPages.2=Expires: 0



auth.redirectUri=



db.protocol=http

db.host=$REPLVARdb_host

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
    echo "$processIdlinky">.linkyPid
  else
    processIdlinky=$(<.linkyPid)
  fi
  tailCmd="tail -f localrun/noint.out"
fi





#------------
# Plugin-PostStart
#------------







#------------
# Plugin-LeaveComp
#------------








#------------
# WaitBuilder
#------------

# waiting for ctrl-c
if [ "$TAIL" == "YES" ]; then
  $tailCmd
else
  echo "$tailCmd"
  echo "<return> to rebuild, ctrl-c to stop lucene, cdb, linky"
  while true; do
    read </dev/tty
    f_build
    f_deploy
  done
fi





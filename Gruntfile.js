/*
Grunt configuration file for TEDxTuftsUniversity site.
Grunt is used to automate tasks relevant to this site.
Tony Cannistra, 2015
Jackson Clawson, 2017
*/

/* Specifies which files to upload to remote server */
static_fileobject =  [
    // Delete from s3 all files that are not in _/site
    { cwd: "_site/", dest: "/", action: 'delete'},
    // Upload to s3 those files that do not exist or have changed
    { expand: true, cwd: '_site/', src: "**", dest: "/", action: 'upload'}
]


module.exports = function(grunt) {

    aws_config = {};

    try {
        aws_config = grunt.file.readJSON('aws-s3-config.json');
    }
    catch(err){
        console.log("Warning, no aws-s3-config.json file configured. Deployment disabled.");
    };

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        aws: aws_config,
        // Automatically run a task when a file changes
        watch: {
            styles: {
                files: [
                    'scss/*'
                ],
                tasks: 'compass:dev'
            }
        },
        // Compile scss
        compass: {
            foundation: {
                options: {
                    sassDir: 'bower_components/foundation/scss',
                    cssDir: 'stylesheets',
                    sourcemap: true
                }
            },
            dev: {
                options: {
                    sassDir: 'scss',
                    cssDir: 'stylesheets',
                    specify: 'scss/app.scss',
                    sourcemap: true
                }
            }
        },
        // configure jekyll build and serve tasks
        shell : {
            jekyllBuild : {
                command: "jekyll build"
            },
            jekyllServe : {
                command: "jekyll serve"
            },
            jekyllServe_nobuild : {
                command: "jekyll serve --skip-initial-build"
            },
            compress_images: {
                command: "cd _site/public; mogrify -verbose -strip -interlace Plane -sampling-factor 4:2:0 -resize 400x400 */*.jpg"
            }
        },
        // configure aws s3 tasks
        aws_s3: {
            options : {
                accessKeyId: '<%= aws.AWSAccessKeyId %>',
                secretAccessKey: '<%= aws.AWSSecretKey %>',
                region: 'us-east-1',
            },
            deploy_staging : {
                options : {
                    bucket : '<%= aws.AWSBucketName_staging %>',
                    differential: true
                },
                files : static_fileobject
            },
            deploy_production : {
                options : {
                    bucket : '<%= aws.AWSBucketName_production %>',
                    differential: true
                },
                files : static_fileobject
            },

        }
    });

    // Load the plugin that provides the "compass" task.
    grunt.loadNpmTasks('grunt-contrib-compass');
    // load plugin for live sass compiling.
    grunt.loadNpmTasks('grunt-contrib-watch');
    // load shell task runner
    grunt.loadNpmTasks('grunt-shell');
    // load AWS S3 interface tasks
    grunt.loadNpmTasks('grunt-aws-s3');
    // create deployment task (above AWS abstraction)
    grunt.registerTask('deploy', "Deploy site to AWS S3. Requires aws-s3-config.json file."+
    " deploy:staging and deploy:production specify which of 2"+
    "   buckets to deploy to.", function(type){
        if(type == "staging" || type == "production"){
            grunt.task.run(['compass', 'shell:jekyllBuild', 'shell:compress_images', 'aws_s3:deploy_' + type]);
        } else {
            grunt.log.writeln("Specify 'staging' or 'production'");
        }
    });
    grunt.registerTask('serve_compressed', ['compass', 'shell:jekyllBuild', 'shell:compress_images', 'shell:jekyllServe_nobuild'])

    // default tasks
    grunt.registerTask('default', ['compass', 'shell:jekyllServe']);

};

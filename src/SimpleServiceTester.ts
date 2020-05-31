// File: SimpleServiceTester.ts
// Purpose: Example of encapsulating Promise code in a class
// Copyright Norman Wilde 2020.
// Unless otherwise noted this work is licensed under a creative commons
// attribution 4.0 international license.
// http://creativecommons.Org/licenses/by/4.0/

import http = require("http");
import AWS from "aws-sdk";
const S3 = new AWS.S3();

const IS_TEST:boolean = false; // for unit test run

export class SimpleServiceTester {
    ////// variables for a set of service tests
    host: string; 
    port: string;
    s3bucketName: any;

    ////// variables for the currently running service test
    testId: string = ""; // test identifier - for bucket object name
    testPath: string = ""; // path - comes after host and port in url
    testQuery: any = null; // query part of url, or null if absent
    testStartMs: number = 0; // start of test, ms since epoch
    testReturned: string = ""; // body of result returned from server
    testPassed: boolean = true; // true if testReturned is what is wanted

    ///// Public methods //////
    /**
     * @param theHost - hostname for service to test, e.g. myserv.mycomp.com
     * @param thePort - port where service listens, e.g. 8080
     * @param theS3BucketName - bucket to write test results, or
     *    null if results should be written to console.log()
     */
    constructor(theHost:string, thePort:string, theS3BucketName:any) {
        this.host = theHost;
        this.port = thePort;
        this.s3bucketName = theS3BucketName;
    } // end constructor

    /**
     * Checks if the host, port and S3 bucket are usable for tests.
     * Use to fail fast so that we don't need to handle these error
     * cases in test code.
     * @returns a resolved Promise if there is no error
     * or rejects with an error message
     */
    ok(): Promise<any> {
        const testUrl: string = "http://" + this.host + ":" + this.port;
        const ERROR_WAIT: number = 5000; //ms to wait to see if error ocurred
        let errorOnGet: boolean = false;
        let errorMessageOnGet: string = "";
        let p: Promise<any> = Promise.resolve()
            .then(() => {
                // to check valid host and port, do an http.get
                // and see if it generates an error event
                http.get(testUrl).on('error', (e) => {
                    errorMessageOnGet = e.message;
                    errorOnGet = true;
                });
            }).
            then(() => {
                // Wait ERROR_WAIT ms to see if error ocurred
                // and return resolved or rejected Promise accordingly
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (!errorOnGet) {
                            resolve();
                        } else {
                            reject("Error in http.get: " + errorMessageOnGet);
                        };
                    }, ERROR_WAIT);
                });
            }).
            // Check we have head access to the S3 bucket
            then(() => {
                if(this.s3bucketName === null){
                    return null; // no bucket specified so nothing to test
                } else {
                    // return a Promise that resolves if we have access
                    // and rejects otherwise
                    return new Promise((resolve, reject) => {
                        let params = { Bucket: this.s3bucketName };
                        S3.headBucket(params, function(err, data){
                            if(err) reject("S3 bucket error: " + err);
                            else resolve();
                        })
                    });
                } // end else
            }).
            // Collect exceptions here in case something unexpected happened
            catch((err) => {
                throw new Error("OK error: " + err);
            });
        return p;
    } // end ok()

    /**
     * Initialize to start a new service test
     * @param tId 
     * @param tPath 
     * @param tQuery 
     */
    setupTest(tId:string, tPath: string, tQuery: any) {
        this.testId = tId;
        this.testPath = tPath;
        this.testQuery = tQuery;
        let dNow = new Date();
        this.testStartMs = dNow.getTime();
        this.testReturned = "";
        this.testPassed = false;
        return null; 
    } // end setupTest

    /**
     * Does a get operation on the specified path and query
     * Puts response body in this.testReturned.
     * Returns a resolved Promise unless there is a fatal error
     */
    doGet(): Promise<any> {
        let url: string = "http://" + this.host + ":" + this.port +
            "/" + this.testPath;
        if (this.testQuery !== null) {
            url += "/";
            url += this.testQuery;
        }
        //console.log(url); //DEBUG
        let gPromise = new Promise((resolve, reject) => {
            // DEBUG console.log("get called");
            http.get(url, (res) => {
                res.on('data', (chunk) => {
                    // DEBUG console.log("data called: " + this.testReturned.length);
                    this.testReturned += chunk;
                });
                res.on('end', () => {
                    // DEBUG console.log("end called");
                    resolve(null);
                });
            }).on('error', (e) => {
                // should have called ok() first so errors are
                // "almost impossible" here - but we will check anyway
                // We cannot continue other tests, since the error may appear
                // too late, so fail the whole chain
                reject("Error in doGet: " + e.message);
            });
        });
        return gPromise;
    }  // end doGet()

    /**
     * Checks if the value in this.testReturned contains the match string
     * and sets testPassed to true or false accordingly. 
     * This function is synchronous so it returns a value, not a Promise
     * @return always null
     * @param matchString test succeeds if doGet result contains this string
     */
    checkResult(matchString: string): any {
        if (-1 == this.testReturned.indexOf(matchString)) {
            this.testPassed = false;
        } else {
            this.testPassed = true;
        }
        return null;
    } // end checkResult

    /**
     * Puts an empty text file in the S3 bucket whose key (name)
     * is a string with the time the test started, the test id, and the 
     * PASS|FAIL result. If the S3 bucket is null, the string is
     * written to console.log() 
     * @return a resolved promise unless there is an error
     */
    writeResult(): Promise<any> {
        let wPromise = new Promise((resolve, reject) => {
            let key: string = "" + this.testStartMs + "_" + this.testId;
            if (this.testPassed) {
                key += "_PASS.txt";
            } else {
                key += "_FAIL.txt";
            };
            if (null == this.s3bucketName) {
                console.log(key);
                resolve(null);
            } else {
                let params = {
                    Body: "",
                    Bucket: this.s3bucketName,
                    Key: key,
                };
                S3.putObject(params, function (err, data) {
                    if (err) reject(err); // an error occurred
                    else resolve(null);   // successful response
                });
            }
        });
        return wPromise;
    } // end writeResult

    ///// Private methods for testing ////////
    static logPass(testname:string){
        console.log("pass Test " + testname);
        return null;
    }
    static logFail(testname:string){
        console.log("FAIL Test " + testname);
        return null;
    }
    /**
     * Run unit tests of this class - output each to console
     */
    static classTest() {
        // T01 - ok() returns resolved promise for valid host, port
        let sst01 = new SimpleServiceTester("example.com", "80", null);
        sst01.ok().
        then(() => SimpleServiceTester.logPass("T01")).
        catch ((e) => SimpleServiceTester.logFail("T01 " + e));

        // T02 - ok() returns promise that rejects with error message for
        //            invalid host
        let sst02 = new SimpleServiceTester("doesNotExistXXWWEE.com", "80", null);
        sst02.ok().
        then(() => SimpleServiceTester.logFail("T02")).
        catch ((e) => SimpleServiceTester.logPass("T02 " + e));
       
        // T03 - ok() returns promise that rejects with error message for
        //            time out
        let sst03 = new SimpleServiceTester("localhost", "7744", null);
        sst03.ok().
        then(() => SimpleServiceTester.logFail("T03")).
        catch ((e) => SimpleServiceTester.logPass("T03 " + e));

        // T04 - ok() returns promise that rejects for a bucket we don't own
        //   NOTE - Run "aws configure" first to set credentials
        let sst04 = new SimpleServiceTester("example.com", "80", "not-my-bucket");
        sst04.ok().
        then(() => SimpleServiceTester.logFail("T04")).
        catch ((e) => SimpleServiceTester.logPass("T04 " + e));

        // T05 - ok returns resolved promise for bucket we can access
        //   NOTE - Run "aws configure" first to set credentials
        let sst05 = new SimpleServiceTester("example.com", "80", "202002-modularize-promise-logs");
        sst05.ok().
        then(() => SimpleServiceTester.logPass("T05")).
        catch ((e) => SimpleServiceTester.logFail("T05 " + e));

        // T06 - test removed
        SimpleServiceTester.logPass("T06");
        
        // T07 - doGet() returns the message body for a valid url and path
        let sst07 = new SimpleServiceTester("example.com", "80", null);
        sst07.setupTest("T07", "", null);
        sst07.doGet().then(() => {
            //console.log(sst07.testReturned); // DEBUG
            if (-1 != sst07.testReturned.indexOf("Example Domain")){
                SimpleServiceTester.logPass("T07");
            } else {
                SimpleServiceTester.logFail("T07 " + sst07.testReturned);
            }
        }).catch((e) => {SimpleServiceTester.logFail("T07 catch: " + e)});       

        // T08 checkMatch sets testPassed to true if there is a match
        let sst08 = new SimpleServiceTester("", "", null);
        sst08.testReturned = "Four score and seven years";
        sst08.checkResult("and seven");
        if (sst08.testPassed) {
            SimpleServiceTester.logPass("T08")
        } else {
            SimpleServiceTester.logFail("T08")
        }

        // T09 checkMatch sets testPassed to false if there is no match
        let sst09 = new SimpleServiceTester("", "", null);
        sst09.testReturned = "Four score and seven years";
        sst09.checkResult("eighteen");
        if (!sst09.testPassed) {
            SimpleServiceTester.logPass("T09")
        } else {
            SimpleServiceTester.logFail("T09")
        }

        // T10 - writeResult signals a pass if testPassed is true
        let sst10 = new SimpleServiceTester("", "80", null);
        sst10.setupTest("T10", "something.com", null);
        sst10.testPassed = true;
        sst10.writeResult(); // should print string with T10 and PASS

        // T11 - writeResult does not fail if we have access to the s3 bucket
        //   NOTE - Run "aws configure" first to set credentials
        let sst11 = new SimpleServiceTester("example.com", "80", "202002-modularize-promise-logs");
        sst11.setupTest("T11","",null);
        sst11.testPassed = true;
        sst11.writeResult().
        then(() => SimpleServiceTester.logPass("T11")).
        catch ((e) => SimpleServiceTester.logFail("T11 " + e));

    } // end classTest
} // end class SimpleServiceTester

if (IS_TEST){
    SimpleServiceTester.classTest();
}

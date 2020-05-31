// File: shortExampleMain.ts
// Purpose: Use SimpleServiceTester to check that 2 web pages are accessible
// Copyright Norman Wilde 2020.
// Unless otherwise noted this work is licensed under a creative commons
// attribution 4.0 international license.
// http://creativecommons.Org/licenses/by/4.0/

import { SimpleServiceTester} from "./SimpleServiceTester";
const sst = new SimpleServiceTester("www.normanwilde.net", "80", null);
Promise.resolve(). // initial resolved Promise to start the chain
then( ()=> console.log("Starting tests of normanwilde.net") ).
then( ()=> sst.ok()). // check basic configuration of sst object
then( ()=> sst.setupTest("test01", "publishedWorks.htm", null) ).
then( ()=> sst.doGet() ).
then( ()=> sst.checkResult("JOURNALS") ).
then( ()=> sst.writeResult() ).
then( ()=> console.log("test01 done") ).
then( ()=> sst.setupTest("test02", "publications/index.html", null) ).
then( ()=> sst.doGet() ).
then( ()=> sst.checkResult("Technical") ).
then( ()=> sst.writeResult() ).
catch((err)=> console.log("Testing error: " + err) ).
finally(()=> console.log("Ended tests of normanwilde.net") );
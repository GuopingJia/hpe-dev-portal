---
title: Using MapReduce with an HPE Ezmeral Data Fabric database binary table
date: 2022-11-14T15:56:03.596Z
featuredBlog: false
author: Raymond Yan
authorimage: /img/raymondyan-profile.png
thumbnailimage: /img/mapreduce_with_edf_binarytable.png
disable: false
tags:
  - hpe-ezmeral-data-fabric
  - hpe-ezmeral
  - MapReduce
---
## Introduction

No matter what kind of application you want to develop, the underlying layer will need a database.
Nowadays, applications based on big data are generally divided into two types: BI (Business Intelligence) and AI (Artificial Intelligence).
Naturally, both of these two types of applications require a big data system as a base.
In traditional applications, we use RDBMS as the database, but in big data systems, we need to use NoSQL databases.

### Advantages of using HPE Ezmeral Data Fabric database

Let's first look at the position of the HPE Ezmeral Data Fabric database in the HPE Ezmeral Data Fabric software stack.
Since the bottom layer of HPE Ezmeral Data Fabric database is the file system, you get the benefits of better performance, simpler management, and ease of use.

![HPE EDF Database is based on file system](/img/system_architecture_position-hpe-edf_database.png "Position of the database in HPE EDF stack")

In my personal experience, I have found this to be true. For example, when using open source Apache Hadoop, due to its design principles, in order to fully realize the performance of Hadoop, it is necessary to merge small files before putting them in. With HPE Ezmeral Data Fabric file system, it's not necessary to care about whether small files need to be merged due to the existence of the logical unit volume within the file system. Another advantage of using HPE Ezmeral Data Fabric file system is that it provides the widely used protocol interface - NFS - allowing you to mount the HPE Ezmeral Data Fabric file system as an NFS file system on your PC.
That is to say, you can mount the HPE Ezmeral Data Fabric file system as an NFS file system on your PC. This is something that Hadoop and other peer commercial software cannot do.

I have some additional thoughts on important unique advantages of HPE Ezmeral Data Fabric database.
The first thing that comes to my mind is, the simplicity of the product.

For example, if you are using products in the Apache Hadoop ecosystem, or a commercial version of a big data system like Cloudera, you need to install and maintain the NoSQL service included in it separately. One often comes into contact with HBase, Mongo, DB, etc.
But in HPE Ezmeral Data Fabric, you don't need to deploy HBase and MongoDB separately, because these two different types of NoSQL systems have been integrated in HPE Ezmeral Data Fabric core as HPE Ezmeral Data Fabric database. From the process level, you only see one MFS process.

When you are using HBase, you need to consider the HBase Master and Region Server processes, as well as the underlying Hadoop Namenode and Datanode processes.
HPE Ezmeral Data Fabric database includes two different types of NoSQL database systems, namely: Binary Table and JSON Table, which correspond to open source HBase and MongoDB respectively.
Now, only one software process can be seen, which is MFS. When you use a completely open source big data technology stack or other commercial big data platforms, you will still see a bunch of processes. So you can see one of the biggest differences: simplicity.

Though a column-oriented NoSQL database, such as HBase, is a bit outdated in design when compared with a document-oriented NoSQL database, such as MongoDB, I did not have enough information on a better replacement in order to write this article. I did find a demo of Spark based on HBase in the HPE Developer portal entitled [Spark Streaming with HBase](https://developer.hpe.com/blog/spark-streaming-with-hbase/) that I was able to use.

As stated, the advantages of using HPE Ezmeral Data Fabric database focus around simplicity. The advantages of the HPE Ezmeral Data Fabric file system include improved performance, ease of use, and ease of maintenance. Now let me show you how to use them with a Binary Table and MapReduce to apply these advantages when dealing with huge data volumes in a distributed storage and computing system.
As for why we use this kind of NoSQL products, I don’t think I need to go into details here. This is the same as why Hadoop, a big data file system, was born. Simply put, it is because we need to build a distributed storage and computing system. In order to complete the analysis and computation tasks of huge data volumes on cheap commercial computers.
In addition, the main reason for me to write this article is: I did not find a demo article in the HPE Developer portal that introduces the use of Binary Table and MapReduce together, so I would like to add such an example.

## Getting started using MapReduce with HPE Ezmeral Data Fabric

In this article, I will show you how to create the Development Environment for HPE Ezmeral Data Fabric on Linux, Microsoft Windows and Apple Mac in a single-node cluster based on Docker containers. It will provide you with a choice of different HPE Ezmeral Data Fabric versions, based on how it integrates into HPE Ezmeral Ecosystem Packs. This way you can quickly create an HPE Ezmeral Data Fabric environment on your work computer. Then, using this as an example, I'll demonstrate a MapReduce application that uses HPE Ezmeral Data Fabric's database binary table as the backend service. I will create the table using the HBase shell command line tool customized for the HPE Ezmeral Data Fabric database and do aggregation operations using a MapReduce application. Let's get started!

### Prerequisite: Create a Development Environment for HPE Ezmeral Data Fabric

Before you get started, you'll need to set up a Development Environment for HPE Ezmeral Data Fabric. To get some hints on how to do this, refer to the 👉 [Getting Started with Spark on MapR Sandbox](https://developer.hpe.com/blog/getting-started-with-spark-on-mapr-sandbox/) blog post. I recommend that you read the latest official documentation, 👉 [Development Environment for HPE Ezmeral Data Fabric](https://docs.datafabric.hpe.com/70/MapRContainerDevelopers/MapRContainerDevelopersOverview.html), before setting up your environment.

All you really need to do is follow the instructions in the documentation. Be aware that the documentation will instruct you to install Docker Desktop on a Mac, but you don't really have to install Docker Desktop. It's fine to install the Docker Engine using a standard Linux distribution.

**It's worth noting that installing Docker Desktop in Windows won't work.** I tried getting it to work through the following actions: I first installed WSL2 (Windows Subsystem Linux 2) then installed Docker Desktop for Windows and integrated with WSL2, and then ran the HPE Ezmeral Data Fabric Development Environment install script, but it still failed.

So I ended up installing VMWare on my Windows PC, creating a CentOS8 VM, and ran the HPE Ezmeral Data Fabric Development Environment setup script in the VM. This approach proved feasible. Also, you can always choose the version of the development environment you want to deploy. You just need to change the tag of the Docker image.

After running the setup script, you'll have an HPE Ezmeral Data Fabric cluster up and running. But in order to run a MapReduce application, you need to install the YARN framework first. Starting from release of HPE Ezmeral Data Fabric 6.2.0, the YARN framework decoupled from the core platform and exists as an ecosystem component as part of HPE Ezmeral Ecosystem Packs.
So if you are running a Development Environment newer than 6.2.0 (including 6.2.0), you need to complete the steps found in [Installing Hadoop and YARN](https://docs.datafabric.hpe.com/70/AdvancedInstallation/InstallingHadoop.html).

## Using MapReduce on an HPE Ezmeral Data Fabric database binary table

HPE Ezmeral Data Fabric database binary table is equivalent to the HPE Ezmeral Data Fabric version of Apache HBase, but its technical implementation is different from HBase. This is, of course, because the bottom layer of HPE Ezmeral Data Fabric database is the HPE Ezmeral Data Fabric File Store. For users, there is almost no difference between using HPE Ezmeral Data Fabric database binary table and using HBase.

Now, let's imagine that we want to build a user notifications service. Since HBase does not support any operations that go across rows or across tables, in order to implement operations such as **joins** and **group by** in RDBMS, we will use MapReduce to complete some data analysis tasks.

### Create a binary table

**Note**: *The commands in this article are all executed as the user "mapr", which is by default the admin user of the Development Environment for HPE Ezmeral Data Fabric. You can also use the "root" user to create the table and run the application, but if you don't modify the ACEs of the table, the "mapr" user would be not able to see the data in the table.*

We are going to use the [hbase shell](https://docs.datafabric.hpe.com/70/ReferenceGuide/HBaseShellforMapR-DB.html) to create a [binary table](https://docs.datafabric.hpe.com/70/MapR-DB/intro-binary-tables.html) inside the HPE Ezmeral Data Fabric database.
To be able to use the `hbase shell`, you will first need to install the **[mapr-hbase](https://docs.datafabric.hpe.com/70/AdvancedInstallation/InstallingHBase-client-node.html?hl=mapr-hbase)** package.

For data management convenience, I'll show you how to create a volume for the binary table. The commands are as follows:

```bash
sudo -u mapr maprcli volume list -output terse -columns volumename,volumetype,actualreplication,localpath,mounted,mountdir,logicalUsed,used,nameContainerDataThresholdMB,nameContainerSizeMB,needsGfsck

maprcli volume create -name test.binarytable1 -path /testbinarytable1volume

# sudo -u mapr maprcli volume mount -name test.binarytable1 -path /testbinarytable1volume
sudo -u mapr hadoop fs -ls -d -h /testbinarytable1volume
sudo -u mapr hadoop mfs -ls /testbinarytable1volume
```

☝ The volume's name is *test.binarytable1* and it will be mounted as <ins>/testbinarytable1volume/</ins> in the HPE Ezmeral Data Fabric file system.

On any node where the mapr-hbase package is installed, enter the command: "hbase shell" to enter the HBase shell interface.

👇 Execute the following command on the HBase shell interface:

```
create '/testbinarytable1volume/notifications','attributes','metrics'
```

In this example, the table name is <ins>/testbinarytable1volume/notifications</ins> and the "attributes" and "metrics" are column families.

**Note**: In HPE Ezmeral Data Fabric database binary table, the table name is by default a path in the file system.
You can change the style of the table name to be like something that would be found in Apache HBase. Refer to 👉 [Mapping to HBase Table Namespaces](https://docs.datafabric.hpe.com/70/UpgradeGuide/.MappingTableNamespace-HBase-DBbinary_2.html) for details.

### Build and run the MapReduce application

#### MapReduce application source code

For your convenience, I have put the code on Github: [Example-MapReduce-With-EzmeralDataFabricMapR-DatabaseBinaryTable](https://github.com/aruruka/Example-MapReduce-With-EzmeralDataFabricMapR-DatabaseBinaryTable).
You can download it and compile it using Visual Studio Code. This MapReduce application is simple. It follows this logic:

1. Get data from the source table: <ins>/testbinarytable1volume/notifications</ins>.
2. Output aggregated data to the target table: <ins>/testbinarytable1volume/summary</ins>.

This is basically a variation of "Word Count". This MapReduce application simply aggregates the number of rows which contains a column called "type" in the "attributes" column family.
For example, there may be comment type, promotion type, friend-request type, etc. in this table.
Then the app will count how many rows of comment type, promotion type, friend-request type are there.

#### How to run it on HPE Ezmeral Data Fabric

When ready, you can run the MapReduce application on your one-node cluster of the Development Environment for HPE Ezmeral Data Fabric.
Refer to the following commands:

First, use this command to create a new table for storing the counter number:

👇 Execute the following command on the HBase shell interface:

```
create '/testbinarytable1volume/summary','metrics'
```

Then, run the MapReduce application via `yarn jar` command:

```bash
sudo -u mapr \
yarn jar ./target/original-hbase-example-1.0-SNAPSHOT.jar com.shouneng.learn.mapReduce.Main \
  -libjar ./hbase-server-1.4.13.200-eep-810.jar,hbase-client-1.4.13.200-eep-810.jar,hadoop-common-2.7.6.200-eep-810.jar,hbase-common-1.4.13.203-eep-810.jar
```

You should see the following output:

```markdown
yarn jar ./target/original-hbase-example-1.0-SNAPSHOT.jar com.shouneng.learn.mapReduce.Main
WARNING: An illegal reflective access operation has occurred
WARNING: Illegal reflective access by org.apache.hadoop.hbase.util.UnsafeAvailChecker (file:/opt/mapr/hadoop/hadoop-2.7.6/share/hadoop/common/hbase-common-1.4.13.200-eep-810.jar) to method java.nio.Bits.unaligned()
WARNING: Please consider reporting this to the maintainers of org.apache.hadoop.hbase.util.UnsafeAvailChecker
WARNING: Use --illegal-access=warn to enable warnings of further illegal reflective access operations
WARNING: All illegal access operations will be denied in a future release
22/09/18 13:09:58 WARN mapreduce.TableMapReduceUtil: The addDependencyJars(Configuration, Class<?>...) method has been deprecated since it is easy to use incorrectly. Most users should rely on addDependencyJars(Job) instead. See HBASE-8386 for more details.
22/09/18 13:09:58 WARN mapreduce.TableMapReduceUtil: The hbase-prefix-tree module jar containing PrefixTreeCodec is not present.  Continuing without it.
22/09/18 13:09:58 INFO mapreduce.TableMapReduceUtil: Configured mapr.hbase.default.db maprdb
22/09/18 13:09:59 WARN mapreduce.TableMapReduceUtil: The hbase-prefix-tree module jar containing PrefixTreeCodec is not present.  Continuing without it.
22/09/18 13:09:59 WARN mapreduce.TableMapReduceUtil: The hbase-prefix-tree module jar containing PrefixTreeCodec is not present.  Continuing without it.
22/09/18 13:09:59 INFO client.MapRZKBasedRMFailoverProxyProvider: Updated RM address to m2-maprts-vm99-173.mip.storage.hpecorp.net/10.163.173.99:8032
22/09/18 13:09:59 INFO client.ConnectionFactory: mapr.hbase.default.db unsetDB is neither MapRDB or HBase, set HBASE_MAPR mode since mapr client is installed.
22/09/18 13:09:59 INFO client.ConnectionFactory: ConnectionFactory receives mapr.hbase.default.db(unsetDB), set clusterType(HBASE_MAPR), user(mapr), hbase_admin_connect_at_construction(false)
22/09/18 13:09:59 WARN mapreduce.JobResourceUploader: Hadoop command-line option parsing not performed. Implement the Tool interface and execute your application with ToolRunner to remedy this.
22/09/18 13:10:00 INFO client.ConnectionFactory: mapr.hbase.default.db unsetDB is neither MapRDB or HBase, set HBASE_MAPR mode since mapr client is installed.
22/09/18 13:10:00 INFO client.ConnectionFactory: ConnectionFactory receives mapr.hbase.default.db(unsetDB), set clusterType(HBASE_MAPR), user(mapr), hbase_admin_connect_at_construction(false)
22/09/18 13:10:00 INFO util.RegionSizeCalculator: Region size calculation disabled for MapR tables /testbinarytable1volume/notifications
22/09/18 13:10:00 INFO mapreduce.JobSubmitter: number of splits:1
22/09/18 13:10:00 INFO mapreduce.JobSubmitter: Submitting tokens for job: job_1657816483829_0017
22/09/18 13:10:00 INFO mapreduce.JobSubmitter: Executing with tokens: []
22/09/18 13:10:01 INFO security.ExternalTokenManagerFactory: Initialized external token manager class - org.apache.hadoop.yarn.security.MapRTicketManager
22/09/18 13:10:01 INFO impl.YarnClientImpl: Submitted application application_1657816483829_0017
22/09/18 13:10:01 INFO mapreduce.Job: The url to track the job: http://m2-maprts-vm99-173.mip.storage.hpecorp.net:8088/proxy/application_1657816483829_0017/
22/09/18 13:10:01 INFO mapreduce.Job: Running job: job_1657816483829_0017
22/09/18 13:10:09 INFO mapreduce.Job: Job job_1657816483829_0017 running in uber mode : false
22/09/18 13:10:09 INFO mapreduce.Job:  map 0% reduce 0%
22/09/18 13:10:17 INFO mapreduce.Job:  map 100% reduce 0%
22/09/18 13:10:22 INFO mapreduce.Job:  map 100% reduce 100%
22/09/18 13:10:22 INFO mapreduce.Job: Job job_1657816483829_0017 completed successfully
22/09/18 13:10:22 INFO mapreduce.Job: Counters: 59
        File System Counters
                FILE: Number of bytes read=0
                FILE: Number of bytes written=282992
                FILE: Number of read operations=0
                FILE: Number of large read operations=0
                FILE: Number of write operations=0
                MAPRFS: Number of bytes read=347
                MAPRFS: Number of bytes written=170
                MAPRFS: Number of read operations=38
                MAPRFS: Number of large read operations=0
                MAPRFS: Number of write operations=42
        Job Counters
                Launched map tasks=1
                Launched reduce tasks=1
                Rack-local map tasks=1
                Total time spent by all maps in occupied slots (ms)=5632
                Total time spent by all reduces in occupied slots (ms)=8865
                Total time spent by all map tasks (ms)=5632
                Total time spent by all reduce tasks (ms)=2955
                Total vcore-seconds taken by all map tasks=5632
                Total vcore-seconds taken by all reduce tasks=2955
                Total megabyte-seconds taken by all map tasks=5767168
                Total megabyte-seconds taken by all reduce tasks=9077760
                DISK_MILLIS_MAPS=2816
                DISK_MILLIS_REDUCES=3930
        Map-Reduce Framework
                Map input records=4
                Map output records=4
                Map output bytes=55
                Map output materialized bytes=0
                Input split bytes=181
                Combine input records=0
                Combine output records=0
                Reduce input groups=2
                Reduce shuffle bytes=65
                Reduce input records=4
                Reduce output records=2
                Spilled Records=8
                Shuffled Maps =1
                Failed Shuffles=0
                Merged Map outputs=2
                GC time elapsed (ms)=209
                CPU time spent (ms)=4600
                Physical memory (bytes) snapshot=1240059904
                Virtual memory (bytes) snapshot=9576202240
                Total committed heap usage (bytes)=1421869056
        HBase Counters
                BYTES_IN_REMOTE_RESULTS=0
                BYTES_IN_RESULTS=0
                MILLIS_BETWEEN_NEXTS=0
                NOT_SERVING_REGION_EXCEPTION=0
                NUM_SCANNER_RESTARTS=0
                NUM_SCAN_RESULTS_STALE=0
                REGIONS_SCANNED=0
                REMOTE_RPC_CALLS=0
                REMOTE_RPC_RETRIES=0
                ROWS_FILTERED=0
                ROWS_SCANNED=0
                RPC_CALLS=0
                RPC_RETRIES=0
        Shuffle Errors
                IO_ERROR=0
        File Input Format Counters
                Bytes Read=0
        File Output Format Counters
                Bytes Written=0
```

**Note**: If you encountered an issue indicating that some of the HBase related Java packages are missing, you can simply copy the following packages from 📁<ins>/opt/mapr/hbase/hbase-{VERSION}/lib/</ins> to 📁<ins>/opt/mapr/hadoop/hadoop-{VERSION}/share/hadoop/common/</ins>.

* hbase-client-*.jar
* hbase-server-*.jar
* hbase-protocol-*.jar
* hbase-hadoop2-compat-*.jar
* hbase-hadoop-compat-*.jar
* hbase-metrics-*.jar
* hbase-metrics-api-*.jar
* hbase-shaded-gson-*.jar
* hbase-shaded-htrace-*.jar
* metrics-core-*.jar
* hbase-common-*.jar

You may run into this issue because the HBase related packages are considered as third-party libraries to the Hadoop system.
For more information, refer to👉: [Install the third-party libraries on each node that runs the program](https://docs.datafabric.hpe.com/70/DevelopmentGuide/Manage3rdPartyLibsForMapReduce.html).

## Glossary

<details>
<summary>HPE Ezmeral Data Fabric (aka. MapR)</summary>

HPE Ezmeral Data Fabric is a platform for data-driven analytics, ML, and AI workloads.
The platform serves as a secure data store and provides file storage, NoSQL databases, object storage, and event streams.
The patented filesystem architecture was designed and built for performance, reliability, and scalability.
📖[Documentation website](https://docs.datafabric.hpe.com/70/index.html)

</details>

<details>
<summary>HPE Ezmeral Ecosystem Packs</summary>

This is a software collection package that includes computing scheduling frameworks and computing engines of common Hadoop ecosystems such as YARN, Spark, Drill, and Hive, as well as a service suite for monitoring performance indicators and logs of HPE Ezmeral Data Fabric.
Users of HPE Ezmeral Data Fabric will use these customized Spark, Drill, Hive and other software to complete computing, analysis tasks and machine learning tasks.

</details>

## Summary

In this blog post, I introduced the advantages of HPE Ezmeral Data Fabric database compared to similar products. I also demonstrated a MapReduce application based on HPE Ezmeral Data Fabric database binary table.
HPE Ezmeral Data Fabric database binary table is equivalent to a better alternative to Apache HBase.

I hope this blog post can help you quickly develop applications based on HPE Ezmeral Data Fabric database binary table.
Please note that developing an application based on HPE Ezmeral Data Fabric database binary table is essentially the same as developing an application based on Apache HBase, but some of the specific steps are different.
For example, in the step of creating a binary table, in addition to the method of using the `habse shell` demonstrated in this article, you can still use `maprcli`, a command line tool proprietary to HPE Ezmeral Data Fabric.
Moreover, the experience of developing a MapReduce application based on HPE Ezmeral Data Fabric database binary table is also applicable to other computing engines, such as Spark.

Stay tuned to the [HPE Developer blog](https://developer.hpe.com/blog) for more interesting posts and tutorials on HPE Ezmeral Data Fabric.
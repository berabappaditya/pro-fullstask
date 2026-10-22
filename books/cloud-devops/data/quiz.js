/*
 * Quiz questions. To add one, copy any entry and edit it:
 *   c: topic   q: question   o: options (2–5)   a: index of the correct option (0-based)   w: why
 */
window.SDB = window.SDB || {};
SDB.data = SDB.data || {};
SDB.data.quiz = [
  /* ------------------------------------------------------------ Foundations */
  { c: "Foundations", q: "In the shared responsibility model, who patches the OS of an EC2 instance?", o: ["AWS", "You, the customer", "Nobody", "The hypervisor"], a: 1, w: "On IaaS you manage the guest OS; on managed services (RDS, Lambda) the provider does." },
  { c: "Foundations", q: "An Availability Zone is…", o: ["A country", "One or more isolated data centres within a region", "A CDN edge", "A VPC"], a: 1, w: "Separate power and networking; deploy across 2+ AZs for HA." },
  { c: "Foundations", q: "Cheapest compute for interruptible batch jobs:", o: ["On-demand", "Reserved", "Spot / Spot VMs", "Dedicated hosts"], a: 2, w: "Deep discounts but can be reclaimed with short notice." },
  { c: "Foundations", q: "GCP's equivalent of AWS S3:", o: ["Persistent Disk", "Cloud Storage", "Filestore", "BigQuery"], a: 1, w: "Object storage with similar storage classes." },
  { c: "Foundations", q: "Serverless containers on GCP vs AWS:", o: ["GKE vs EKS", "Cloud Run vs ECS on Fargate", "App Engine vs EC2", "Cloud Functions vs EC2"], a: 1, w: "Both run containers without managing servers; Cloud Run scales to zero." },
  { c: "Foundations", q: "In IAM policy evaluation, an explicit Deny…", o: ["Is overridden by Allow", "Always wins", "Is ignored for admins", "Only applies to S3"], a: 1, w: "Deny beats allow; anything not allowed is implicitly denied." },
  { c: "Foundations", q: "Best way for an app on EKS to access S3:", o: ["Access keys in env vars", "Keys baked into the image", "A pod IAM role via Pod Identity / IRSA", "The root account"], a: 2, w: "Temporary credentials per pod, no stored keys." },
  { c: "Foundations", q: "How should GitHub Actions authenticate to AWS?", o: ["Long-lived access keys in secrets", "OIDC federation to assume a role", "The developer's password", "SSH keys"], a: 1, w: "Short-lived credentials, nothing to leak." },
  { c: "Foundations", q: "What makes a subnet 'public'?", o: ["Its name", "A route to an internet gateway", "A NAT gateway inside it", "A big CIDR"], a: 1, w: "Private subnets route outbound through NAT or not at all." },
  { c: "Foundations", q: "Instances in private subnets reach the internet via…", o: ["Internet gateway directly", "NAT gateway in a public subnet", "VPC peering", "They can't"], a: 1, w: "NAT allows outbound connections only." },
  { c: "Foundations", q: "Security groups are…", o: ["Stateless", "Stateful, allow-only", "Subnet-level deny lists", "DNS records"], a: 1, w: "Return traffic is allowed automatically; NACLs are stateless." },
  { c: "Foundations", q: "How many addresses in a /24?", o: ["24", "128", "256", "65,536"], a: 2, w: "2^(32−24) = 256 (AWS reserves 5 per subnet)." },
  { c: "Foundations", q: "Which is a private (RFC 1918) range?", o: ["8.8.8.0/24", "10.0.0.0/8", "100.64.0.0/10", "1.1.1.0/24"], a: 1, w: "Private ranges: 10/8, 172.16/12, 192.168/16." },
  { c: "Foundations", q: "Reach S3 from a private subnet without NAT costs:", o: ["VPC gateway endpoint", "Internet gateway", "Public IP", "Elastic IP"], a: 0, w: "Gateway endpoints for S3/DynamoDB are free and private." },
  { c: "Foundations", q: "AWS VPC vs GCP VPC scope:", o: ["Both global", "AWS regional, GCP global with regional subnets", "AWS global, GCP regional", "Both zonal"], a: 1, w: "A notable design difference." },

  /* ------------------------------------------------------------ Running code */
  { c: "Running code", q: "Target-tracking autoscaling does what?", o: ["Scales at fixed times", "Adds/removes instances to keep a metric near a target", "Scales the database", "Moves instances between regions"], a: 1, w: "e.g. average CPU 60% or requests per target." },
  { c: "Running code", q: "Why must autoscaled instances be stateless?", o: ["To save memory", "Scale-in terminates instances; local state would be lost and requests may hit any instance", "For security", "It's required by EC2"], a: 1, w: "Keep sessions in Redis, files in S3." },
  { c: "Running code", q: "RDS Multi-AZ primarily provides…", o: ["Read scaling", "Automatic failover to a synchronous standby", "Cross-region backup", "Caching"], a: 1, w: "Use read replicas for read scaling." },
  { c: "Running code", q: "Read replicas are…", o: ["Synchronous", "Asynchronous copies that may lag", "Write targets", "Only for backups"], a: 1, w: "Read-your-writes needs care." },
  { c: "Running code", q: "Best way to let users upload large files:", o: ["Through the API server memory", "Presigned URLs to upload directly to S3/GCS", "Email them", "Base64 in JSON"], a: 1, w: "Servers never handle the bytes; use multipart for big files." },
  { c: "Running code", q: "S3 lifecycle rules are used to…", o: ["Encrypt objects", "Move objects to cheaper classes and expire them over time", "Replicate DNS", "Scan for viruses"], a: 1, w: "e.g. IA after 30 days, Glacier after 180." },
  { c: "Running code", q: "Layer 7 load balancers can route by…", o: ["Only IP and port", "HTTP host, path and headers", "MAC address", "Disk usage"], a: 1, w: "ALB / Application Load Balancer." },
  { c: "Running code", q: "Use a Network Load Balancer when you need…", o: ["Path routing", "Non-HTTP TCP/UDP, static IPs or extreme throughput", "Cookies", "OAuth login"], a: 1, w: "L4 passthrough with very low latency." },
  { c: "Running code", q: "Connection draining (deregistration delay) ensures…", o: ["Faster DNS", "In-flight requests finish before an instance is removed", "Logs are rotated", "TLS renewal"], a: 1, w: "Pair with graceful shutdown in the app." },
  { c: "Running code", q: "A DNS record pointing the apex ramuchai.in at an AWS load balancer:", o: ["CNAME", "Route 53 alias record", "MX", "TXT"], a: 1, w: "CNAMEs aren't allowed at the zone apex." },
  { c: "Running code", q: "Best way to avoid CDN invalidations on deploy:", o: ["Invalidate everything", "Versioned asset filenames with long cache times", "Disable the CDN", "TTL 0 on everything"], a: 1, w: "New deploys reference new URLs." },
  { c: "Running code", q: "Lambda's maximum execution time:", o: ["30 seconds", "5 minutes", "15 minutes", "Unlimited"], a: 2, w: "Longer work belongs in containers or Step Functions." },
  { c: "Running code", q: "A cold start is…", o: ["A failed deploy", "Extra latency when a new function/container instance initialises", "A database restore", "A frozen VM"], a: 1, w: "Java mitigations: SnapStart, min instances, GraalVM." },
  { c: "Running code", q: "SNS topic → several SQS queues is an example of…", o: ["Sharding", "Fan-out", "Caching", "Replication"], a: 1, w: "Each consumer gets its own queue, retries and DLQ." },
  { c: "Running code", q: "A dead-letter queue holds…", o: ["Deleted messages", "Messages that failed processing after N attempts", "Encrypted messages", "Priority messages"], a: 1, w: "Inspect and replay them after fixing the bug." },
  { c: "Running code", q: "Because SQS standard queues deliver at-least-once, consumers must be…", o: ["Synchronized", "Idempotent", "Single-threaded", "Serverless"], a: 1, w: "Duplicates happen; dedupe by message/business id." },

  /* ------------------------------------------------------------ Delivery */
  { c: "Delivery", q: "Containers differ from VMs because they…", o: ["Include a full guest OS", "Share the host kernel and isolate with namespaces/cgroups", "Can't run Java", "Need a hypervisor each"], a: 1, w: "Smaller and faster to start; VMs give stronger isolation." },
  { c: "Delivery", q: "Why COPY pom.xml before COPY src in a Dockerfile?", o: ["Style", "So the dependency layer is cached until pom.xml changes", "Maven requires it", "Smaller image"], a: 1, w: "Layer caching makes rebuilds fast." },
  { c: "Delivery", q: "Multi-stage builds help by…", o: ["Running containers in parallel", "Leaving build tools out of the final image", "Encrypting layers", "Adding health checks"], a: 1, w: "Build with Maven+JDK, ship only the JRE and app." },
  { c: "Delivery", q: "Containers should run as…", o: ["root", "A non-root user", "The host's admin", "Any user"], a: 1, w: "Limits damage if the app is compromised." },
  { c: "Delivery", q: "Exit code 137 / OOMKilled means…", o: ["Bad image tag", "The container exceeded its memory limit and was killed", "A failed probe", "Network error"], a: 1, w: "137 = 128 + SIGKILL (9)." },
  { c: "Delivery", q: "ImagePullBackOff usually means…", o: ["Out of memory", "Wrong image name/tag or no permission to the registry", "Liveness failure", "Too many replicas"], a: 1, w: "Check the image reference and node/registry credentials." },
  { c: "Delivery", q: "A Kubernetes Service provides…", o: ["Persistent storage", "A stable virtual IP/DNS name load-balancing to matching pods", "Autoscaling", "Secrets"], a: 1, w: "Pods come and go; the Service name stays." },
  { c: "Delivery", q: "A failing readiness probe causes…", o: ["The container restarts", "The pod is removed from Service endpoints (no traffic) without restart", "The node reboots", "Nothing"], a: 1, w: "Liveness failures restart the container." },
  { c: "Delivery", q: "Why add a startup probe for Spring Boot?", o: ["To speed up startup", "So liveness checks don't kill a slow-booting JVM", "To pull images", "For HPA"], a: 1, w: "Other probes wait until it succeeds." },
  { c: "Delivery", q: "A pod stuck in Pending usually means…", o: ["App crashed", "No node has enough requested CPU/memory (or constraints don't match)", "DNS failure", "Bad Service selector"], a: 1, w: "Check kubectl describe events: FailedScheduling." },
  { c: "Delivery", q: "HPA scales…", o: ["Nodes", "The number of pod replicas based on metrics", "Pod memory limits", "The control plane"], a: 1, w: "Cluster Autoscaler / Karpenter add nodes." },
  { c: "Delivery", q: "Simplest place to run a few stateless containers on GCP:", o: ["GKE Standard", "Cloud Run", "Compute Engine with Docker", "Bare metal"], a: 1, w: "Fully managed, scales to zero." },
  { c: "Delivery", q: "Continuous deployment means…", o: ["Manual release button", "Every change passing the pipeline goes to production automatically", "Deploying once a quarter", "Only staging is automated"], a: 1, w: "Continuous delivery stops at a manual approval." },
  { c: "Delivery", q: "Which strategy needs double capacity during the deploy?", o: ["Rolling", "Canary", "Blue-green", "Recreate"], a: 2, w: "Both full stacks run until you switch and retire blue." },
  { c: "Delivery", q: "Which strategy limits blast radius best?", o: ["Recreate", "Canary with automated analysis", "Blue-green", "Big bang"], a: 1, w: "Only a small % of users see a bad version." },
  { c: "Delivery", q: "Zero-downtime schema change pattern:", o: ["Rename the column in the same release", "Expand → migrate → contract", "Stop the app, migrate, start", "Drop and recreate"], a: 1, w: "Old and new versions must both work during the rollout." },
  { c: "Delivery", q: "GitOps means…", o: ["Using git blame", "Git is the source of truth; an agent syncs clusters to it", "Committing binaries", "Only GitHub"], a: 1, w: "Argo CD / Flux; rollbacks are reverts." },
  { c: "Delivery", q: "terraform plan…", o: ["Applies changes", "Shows what would change without changing anything", "Deletes state", "Formats code"], a: 1, w: "Review it; apply the saved plan." },
  { c: "Delivery", q: "Terraform state should be…", o: ["Committed to Git", "Stored remotely with locking and protected access", "Deleted after apply", "On each developer's laptop"], a: 1, w: "It may contain secrets and must not be edited concurrently." },
  { c: "Delivery", q: "In a plan, -/+ means…", o: ["No change", "Resource will be destroyed and recreated (replacement)", "Updated in place", "Imported"], a: 1, w: "Watch out for replacements of databases!" },
  { c: "Delivery", q: "Tag images with…", o: ["latest only", "An immutable version or git SHA", "The date only", "Nothing"], a: 1, w: "Know exactly what runs and roll back reliably." },

  /* ------------------------------------------------------------ Operations */
  { c: "Operations", q: "SLO of 99.9% over 30 days allows about…", o: ["4 minutes", "43 minutes", "7 hours", "3 days"], a: 1, w: "0.1% of 43,200 minutes." },
  { c: "Operations", q: "SLA vs SLO:", o: ["Same", "SLA is the contract with penalties; SLO is the internal target (stricter)", "SLO is legal", "SLA is a metric"], a: 1, w: "SLI is the measurement itself." },
  { c: "Operations", q: "Good paging alerts are based on…", o: ["Any CPU spike", "User-facing symptoms such as SLO burn rate and error rate", "Every log line with WARN", "Disk at 50%"], a: 1, w: "Causes go to dashboards/tickets." },
  { c: "Operations", q: "RED metrics stand for…", o: ["Read, Execute, Delete", "Rate, Errors, Duration", "Redis, Elastic, Docker", "Requests, Events, Data"], a: 1, w: "USE (Utilisation, Saturation, Errors) is for resources." },
  { c: "Operations", q: "Which tells you WHERE latency comes from across services?", o: ["Logs", "Distributed traces", "Billing", "DNS"], a: 1, w: "Spans show time per hop." },
  { c: "Operations", q: "Where should database passwords live?", o: ["application.properties in Git", "A secrets manager, read via the workload's identity", "The Docker image", "A wiki page"], a: 1, w: "With rotation and audit." },
  { c: "Operations", q: "Envelope encryption encrypts data with a data key, which is encrypted by…", o: ["The user's password", "A master key in KMS", "TLS", "Base64"], a: 1, w: "The master key never leaves KMS." },
  { c: "Operations", q: "Which records every AWS API call for auditing?", o: ["CloudWatch Metrics", "CloudTrail", "Route 53", "Inspector"], a: 1, w: "GCP: Cloud Audit Logs." },
  { c: "Operations", q: "A common hidden cloud cost:", o: ["IAM users", "NAT gateway data processing and cross-AZ/egress transfer", "Security groups", "VPCs"], a: 1, w: "Use VPC endpoints and keep chatty traffic local." },
  { c: "Operations", q: "Best discount for steady 24/7 baseline compute:", o: ["Spot", "Savings Plans / committed-use discounts", "On-demand", "Free tier"], a: 1, w: "Spot for interruptible, on-demand for spiky." },

  /* ------------------------------------------------------------ Linux */
  { c: "Linux", q: "Show hidden files with sizes in human units:", o: ["ls", "ls -lah", "dir /a", "cat -h"], a: 1, w: "-l long, -a all, -h human-readable." },
  { c: "Linux", q: "chmod 750 gives…", o: ["Everyone full access", "Owner rwx, group r-x, others nothing", "Owner read only", "Group write"], a: 1, w: "r=4, w=2, x=1 per owner/group/others." },
  { c: "Linux", q: "Follow a log file as it grows:", o: ["cat -f", "tail -f", "head -f", "less -n"], a: 1, w: "Or journalctl -u service -f for systemd services." },
  { c: "Linux", q: "Search recursively, case-insensitive, with line numbers:", o: ["find -i", "grep -rin", "sed -rn", "awk -i"], a: 1, w: "grep -rin 'pattern' dir/" },
  { c: "Linux", q: "Count occurrences of each line, most frequent first:", o: ["sort | uniq -c | sort -rn", "uniq | sort", "wc -l", "cut -c"], a: 0, w: "uniq needs sorted input to group duplicates." },
  { c: "Linux", q: "Which shows listening ports and owning processes?", o: ["ps aux", "ss -tlnp", "df -h", "free -h"], a: 1, w: "netstat -tlnp on older systems." },
  { c: "Linux", q: "Check free disk space per filesystem:", o: ["du -sh", "df -h", "free -h", "lsblk -f"], a: 1, w: "du shows usage per directory." },
  { c: "Linux", q: "Load average 8.0 on a 4-core machine means…", o: ["Idle", "About twice as much runnable work as cores: queueing", "8% CPU", "8 users logged in"], a: 1, w: "Compare load to core count (nproc)." },
  { c: "Linux", q: "Graceful stop signal:", o: ["SIGKILL (9)", "SIGTERM (15)", "SIGSTOP", "SIGHUP always"], a: 1, w: "SIGKILL can't be caught; use it last." },
  { c: "Linux", q: "Disk shows full but du finds nothing big. Likely cause:", o: ["Corrupted disk", "A deleted file still held open by a process", "Swap", "Inodes are fine"], a: 1, w: "lsof +L1 finds it; restart or truncate." },
  { c: "Linux", q: "Run a service on boot with systemd:", o: ["systemctl start", "systemctl enable", "service up", "crontab -r"], a: 1, w: "enable --now enables and starts." },
  { c: "Linux", q: "Test whether a TCP port on another host is reachable:", o: ["ping", "nc -zv host port", "dig", "chmod"], a: 1, w: "Timeout → firewall/SG; refused → nothing listening." },
  { c: "Linux", q: "Redirect both stdout and stderr to a file:", o: ["> out.log", "> out.log 2>&1", "2> out.log only", "| out.log"], a: 1, w: "2>&1 sends stderr where stdout goes." },
  { c: "Linux", q: "Cron field order:", o: ["hour minute day month weekday", "minute hour day-of-month month day-of-week", "second minute hour day month", "day month year"], a: 1, w: "Spring's @Scheduled cron adds seconds at the front." }
];

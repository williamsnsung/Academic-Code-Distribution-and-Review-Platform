/* *******************************************************
simple UDP IPv4 server

saleem, Jan2022
saleem, Jan2021
saleem, Nov2002
saleem, Dec2001
*********************************************************/

#include <stdio.h>
#include <stdlib.h>
#include <inttypes.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <string.h>
#include <unistd.h>

#define G_SRV_PORT   ((uint16_t) 54321) // use 'id -u', or getuid(2)
#define G_SIZE       ((uint32_t) 256)

#define ERROR(_s) fprintf(stdout, _s)

int
main(int argc, char *argv[])
{
  int sd;
  struct sockaddr_in saddr, caddr;
  unsigned char buffer[G_SIZE];
  int r;
  socklen_t l;

  /* open a UDP socket */
  if ((sd = socket(PF_INET, SOCK_DGRAM, IPPROTO_UDP)) < 0) {
    ERROR("socket() failed");
    exit(0);
  }

  (void) memset((void *) &saddr, 0, sizeof(saddr));
  saddr.sin_family      = AF_INET;
  saddr.sin_addr.s_addr = htonl(INADDR_ANY);
  saddr.sin_port        = htons(G_SRV_PORT);

  if (bind(sd, (struct sockaddr *) &saddr, sizeof(saddr)) < 0) {
    ERROR("bind() failed");
    exit(0);
  }
  printf("ready on port %d ...\n\n", ntohs(saddr.sin_port));

  /* read one packet then exit! */
  l = sizeof(caddr);
  if ((r = recvfrom(sd, (void *) buffer, G_SIZE, 0,
                    (struct sockaddr *) &caddr, &l)) < 0) {
    ERROR("recvfrom( problem");
  }
  else {
    buffer[r] = (unsigned char) 0x00;
    printf("received from: %s:%d\n", inet_ntoa(caddr.sin_addr),
             htons(caddr.sin_port));
    printf("%s\n", buffer);
  }

  (void) close(sd);
  return 0;
}

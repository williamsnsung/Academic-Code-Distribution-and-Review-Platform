/*
  Wrapper API for UDP socket in C.

  Saleem Bhatti <https://saleem.host.cs.st-andrews.ac.uk/>

  Only handles IPv4 for now.

  Jan 2022
  Jan 2021
  Jan 2004
  Nov 2002
*/

#include <stdlib.h>
#include <string.h>
#include <inttypes.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <unistd.h>

#include <errno.h>
void perror(const char *s);

#include "UdpSocket.h"

#ifndef INADDR_NONE
#define INADDR_NONE 0xffffffff /* should be in <netinet/in.h> */
#endif

UdpSocket_t *
setupUdpSocket_t(const char *hostname, const uint16_t port)
{
  int error = 0;
  struct in_addr addr;

  UdpSocket_t *udp = (UdpSocket_t *) calloc(1, sizeof(UdpSocket_t));

  /* local end-point, ephemeral port number */
  if ((hostname == (char *) 0) && (port == 0)) {
    udp->addr.sin_addr.s_addr = htonl(INADDR_ANY);
    udp->addr.sin_port        = htons(INADDR_ANY);
  }

  /* local end-point, designated port number */
  else if ((hostname == (char *) 0) && (port != 0)) {
    udp->addr.sin_addr.s_addr = htonl(INADDR_ANY);
    udp->addr.sin_port        = htons(port);
  }

  /* remote end-point */
  else if ((hostname != (char *) 0) && (port != 0)) {

    /* dot notation address */
    addr.s_addr = (in_addr_t) 0;
    if (inet_aton(hostname, &addr) == 0) { // not dot notation

      /* try to resolve hostname */
      struct hostent *hp = gethostbyname(hostname);
      if (hp == (struct hostent *) 0) {
        perror("setupUdpSocket_t(): gethostbyname()");
        error = 1; /* none or badly formed remote hostname */
      }

      else {
        memcpy((void *) &addr.s_addr,
               (void *) *hp->h_addr_list, sizeof(addr.s_addr));
      }
    }

    if (addr.s_addr != (in_addr_t) 0) {
      udp->addr.sin_family = AF_INET;
      udp->addr.sin_addr.s_addr = addr.s_addr;
      udp->addr.sin_port = htons(port);
    }
    else { error = 1; }
  }

  else { error = 1; }

  if (error) {
    free(udp);
    udp = (UdpSocket_t *) 0;
  }

  return udp;
}

int
openUdp(UdpSocket_t *udp)
{
  /* open a UDP socket */
  if ((udp->sd = socket(PF_INET, SOCK_DGRAM, IPPROTO_UDP)) < 0) {
    perror("openUdp(): socket()");
    return -1;
  }

  if (bind(udp->sd, (struct sockaddr *) &udp->addr, sizeof(udp->addr)) < 0) {
    perror("openUdp(): bind()");
    return -1;
  }

  return 0;
}


int
sendUdp(const UdpSocket_t *local, const UdpSocket_t *remote,
        const UdpBuffer_t *buffer)
{
  int r = sendto(local->sd, (void *) buffer->bytes, buffer->n, 0,
                 (struct sockaddr *) &remote->addr, sizeof(remote->addr));
  if (r < 0) { perror("sendUdp(): sendto()"); }

  return r;
}


int
recvUdp(const UdpSocket_t *local, const UdpSocket_t *remote,
        UdpBuffer_t *buffer)
{
  int r;
  socklen_t l = sizeof(struct sockaddr);
  r = recvfrom(local->sd, (void *) buffer->bytes, buffer->n, 0,
               (struct sockaddr *) &remote->addr, &l);
  return r;
}

void
closeUdp(UdpSocket_t *udp)
{
  if (udp->sd > 0) { (void) close(udp->sd); }
  udp->sd = 0;
}

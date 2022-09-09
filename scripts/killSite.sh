#!/bin/bash
kill $(ps axo user:20,pid,comm | grep 'cs3099user03'| grep 'npm' | awk '{print $2}')
kill $(ps  axo user:20,pid,comm| grep 'cs3099user03'| grep 'node' | awk '{print $2}')

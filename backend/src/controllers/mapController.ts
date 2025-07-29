import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Interface for election data
interface ElectionData {
  Constituency: string;
  Assembly_Segments?: Array<{
    Name: string;
    Latitude: number;
    Longitude: number;
    Winner_Candidate: string;
    Winner_Party: string;
    Winner_Votes: number;
    Winner_Percentage: number;
    Runner_Up_Candidate: string;
    Runner_Up_Party: string;
    Runner_Up_Votes: number;
    Runner_Up_Percentage: number;
    Margin: number;
  }>;
}

interface AssemblyData {
  Constituency: string;
  Latitude: number;
  Longitude: number;
  Total_Votes_Constituency: number;
  NOTA_Votes_Constituency: number;
  Party_Votes_Assembly_Aggregated: Record<string, number>;
}

// Get all states for India map
export const getStates = async (req: Request, res: Response): Promise<void> => {
  try {
    const states = await prisma.state.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        latitude: true,
        longitude: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: states,
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({
      error: 'Failed to fetch states',
      details: error,
    });
  }
};

// Get assemblies/constituencies for a specific state
export const getAssembliesByState = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { stateId } = req.params;
    const { year = '2024' } = req.query;

    if (!stateId) {
      res.status(400).json({ error: 'State ID is required' });
      return;
    }

    // Get constituencies from database
    const constituencies = await prisma.constituency.findMany({
      where: {
        stateId,
      },
      include: {
        state: {
          select: {
            name: true,
            code: true,
          },
        },
        district: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Try to load election data from form20 folder
    let electionData: AssemblyData[] = [];
    try {
      const state = await prisma.state.findUnique({
        where: { id: stateId },
        select: { code: true },
      });

      if (state) {
        // Try to find election data file
        const electionDataPath = path.join(
          __dirname,
          '..',
          '..',
          'form20',
          state.code.toLowerCase(),
          year as string,
          'assembly.json'
        );

        if (fs.existsSync(electionDataPath)) {
          const fileContent = fs.readFileSync(electionDataPath, 'utf8');
          electionData = JSON.parse(fileContent);
        }
      }
    } catch (error) {
      console.log('Election data not found for state:', stateId, 'year:', year);
    }

    // Merge constituency data with election data
    const assembliesWithElectionData = constituencies.map((constituency) => {
      const electionInfo = electionData.find(
        (ed) =>
          ed.Constituency.toLowerCase() === constituency.name.toLowerCase()
      );

      return {
        id: constituency.id,
        name: constituency.name,
        code: constituency.code,
        type: constituency.type,
        latitude: constituency.latitude,
        longitude: constituency.longitude,
        state: constituency.state,
        district: constituency.district,
        electionData: electionInfo || null,
      };
    });

    res.json({
      success: true,
      data: {
        assemblies: assembliesWithElectionData,
        year,
      },
    });
  } catch (error) {
    console.error('Error fetching assemblies:', error);
    res.status(500).json({
      error: 'Failed to fetch assemblies',
      details: error,
    });
  }
};

// Get polling booths for a specific assembly/constituency
export const getPollingBoothsByAssembly = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { constituencyId } = req.params;
    const { year = '2024' } = req.query;

    if (!constituencyId) {
      res.status(400).json({ error: 'Constituency ID is required' });
      return;
    }

    // Get constituency information
    const constituency = await prisma.constituency.findUnique({
      where: {
        id: constituencyId,
      },
      include: {
        state: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (!constituency) {
      res.status(404).json({ error: 'Constituency not found' });
      return;
    }

    // Load polling booth data from form20 folder
    let pollingBoothsData: ElectionData[] = [];
    try {
      const pollingDataPath = path.join(
        __dirname,
        '..',
        '..',
        'form20',
        constituency.state.code.toLowerCase(),
        year as string,
        'pooling.json'
      );

      if (fs.existsSync(pollingDataPath)) {
        const fileContent = fs.readFileSync(pollingDataPath, 'utf8');
        const allPollingData: ElectionData[] = JSON.parse(fileContent);

        // Try multiple matching strategies
        pollingBoothsData = allPollingData.filter((pd) => {
          const jsonConstituency = pd.Constituency.toLowerCase().trim();
          const dbConstituency = constituency.name.toLowerCase().trim();

          // Direct match
          if (jsonConstituency === dbConstituency) {
            console.log(`Direct match found: "${pd.Constituency}"`);
            return true;
          }

          // Remove special characters and try again
          const normalizeStr = (str: string) =>
            str
              .toLowerCase()
              .replace(/[^\w\s]/g, '')
              .replace(/\s+/g, ' ')
              .trim();

          if (normalizeStr(jsonConstituency) === normalizeStr(dbConstituency)) {
            return true;
          }

          // Check if one contains the other
          if (
            jsonConstituency.includes(dbConstituency) ||
            dbConstituency.includes(jsonConstituency)
          ) {
            return true;
          }

          return false;
        });
      }
    } catch (error) {
      console.log(
        'Polling data not found for constituency:',
        constituencyId,
        'year:',
        year
      );
      console.error('Error details:', error);
    }

    // Transform polling booth data
    const pollingBooths = pollingBoothsData.flatMap((constituencyData) =>
      (constituencyData.Assembly_Segments || []).map((booth) => ({
        id: `${constituencyId}-${booth.Name.replace(/\s+/g, '-').toLowerCase()}`,
        name: booth.Name,
        latitude: booth.Latitude,
        longitude: booth.Longitude,
        constituencyId,
        constituencyName: constituency.name,
        electionResults: {
          winner: {
            candidate: booth.Winner_Candidate,
            party: booth.Winner_Party,
            votes: booth.Winner_Votes,
            percentage: booth.Winner_Percentage,
          },
          runnerUp: {
            candidate: booth.Runner_Up_Candidate,
            party: booth.Runner_Up_Party,
            votes: booth.Runner_Up_Votes,
            percentage: booth.Runner_Up_Percentage,
          },
          margin: booth.Margin,
          year: year as string,
        },
      }))
    );

    res.json({
      success: true,
      data: {
        constituency: {
          id: constituency.id,
          name: constituency.name,
          code: constituency.code,
          latitude: constituency.latitude,
          longitude: constituency.longitude,
          state: constituency.state,
        },
        pollingBooths,
        year,
      },
    });
  } catch (error) {
    console.error('Error fetching polling booths:', error);
    res.status(500).json({
      error: 'Failed to fetch polling booths',
      details: error,
    });
  }
};

// Get detailed election data for a specific polling booth
export const getPollingBoothDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { constituencyId } = req.params;
    let { boothName } = req.params;
    const { years = '2024,2022' } = req.query;

    if (!constituencyId || !boothName) {
      res.status(400).json({
        error: 'Constituency ID and booth name are required',
      });
      return;
    }

    // Decode the booth name properly
    boothName = decodeURIComponent(boothName);

    // Get constituency information
    const constituency = await prisma.constituency.findUnique({
      where: {
        id: constituencyId,
      },
      include: {
        state: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (!constituency) {
      res.status(404).json({ error: 'Constituency not found' });
      return;
    }

    const yearsList = (years as string).split(',');
    const boothDetailsData: any = {};

    // Load data for each requested year
    for (const year of yearsList) {
      try {
        const pollingDataPath = path.join(
          __dirname,
          '..',
          '..',
          'form20',
          constituency.state.code.toLowerCase(),
          year.trim(),
          'pooling.json'
        );

        if (fs.existsSync(pollingDataPath)) {
          const fileContent = fs.readFileSync(pollingDataPath, 'utf8');
          const allPollingData: ElectionData[] = JSON.parse(fileContent);

          // Find ALL constituencies that match our search criteria
          const matchingConstituencies = allPollingData.filter((pd) => {
            const jsonConstituency = pd.Constituency.toLowerCase().trim();
            const dbConstituency = constituency.name.toLowerCase().trim();

            // Direct match
            if (jsonConstituency === dbConstituency) return true;

            // Remove special characters and try again
            const normalizeStr = (str: string) =>
              str
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            if (normalizeStr(jsonConstituency) === normalizeStr(dbConstituency))
              return true;

            // Check if one contains the other
            if (
              jsonConstituency.includes(dbConstituency) ||
              dbConstituency.includes(jsonConstituency)
            )
              return true;

            return false;
          });

          // Collect all assembly segments from all matching constituencies
          let allAssemblySegments: any[] = [];
          matchingConstituencies.forEach((constData) => {
            if (constData.Assembly_Segments) {
              allAssemblySegments = allAssemblySegments.concat(
                constData.Assembly_Segments
              );
            }
          });

          if (allAssemblySegments.length > 0) {
            const boothData = allAssemblySegments.find((booth) => {
              const jsonBoothName = booth.Name.toLowerCase().trim();
              const searchBoothName = boothName.toLowerCase().trim();

              // Direct match
              if (jsonBoothName === searchBoothName) return true;

              // Remove special characters and try again
              const normalizeStr = (str: string) =>
                str
                  .toLowerCase()
                  .replace(/[^\w\s]/g, '')
                  .replace(/\s+/g, ' ')
                  .trim();

              if (normalizeStr(jsonBoothName) === normalizeStr(searchBoothName))
                return true;

              // Check if one contains the other
              if (
                jsonBoothName.includes(searchBoothName) ||
                searchBoothName.includes(jsonBoothName)
              )
                return true;

              return false;
            });

            if (boothData) {
              boothDetailsData[year] = {
                name: boothData.Name,
                latitude: boothData.Latitude,
                longitude: boothData.Longitude,
                winner: {
                  candidate: boothData.Winner_Candidate,
                  party: boothData.Winner_Party,
                  votes: boothData.Winner_Votes,
                  percentage: boothData.Winner_Percentage,
                },
                runnerUp: {
                  candidate: boothData.Runner_Up_Candidate,
                  party: boothData.Runner_Up_Party,
                  votes: boothData.Runner_Up_Votes,
                  percentage: boothData.Runner_Up_Percentage,
                },
                margin: boothData.Margin,
                year,
              };
            }
          }
        }
      } catch (error) {
        console.log(`Polling data not found for year ${year}`);
      }
    }

    if (Object.keys(boothDetailsData).length === 0) {
      res.status(404).json({
        error: 'Polling booth data not found',
        message: `No data found for booth "${boothName}" in constituency "${constituency.name}"`,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        constituency: {
          id: constituency.id,
          name: constituency.name,
          code: constituency.code,
          state: constituency.state,
        },
        booth: {
          name: boothName,
          yearlyData: boothDetailsData,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching polling booth details:', error);
    res.status(500).json({
      error: 'Failed to fetch polling booth details',
      details: error,
    });
  }
};

// Get election comparison data between years
export const getElectionComparison = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { stateId } = req.params;
    const { years = '2024,2022', constituency } = req.query;

    if (!stateId) {
      res.status(400).json({ error: 'State ID is required' });
      return;
    }

    const state = await prisma.state.findUnique({
      where: { id: stateId },
      select: { code: true, name: true },
    });

    if (!state) {
      res.status(404).json({ error: 'State not found' });
      return;
    }

    const yearsList = (years as string).split(',');
    const comparisonData: any = {};

    for (const year of yearsList) {
      try {
        // Load assembly data for comparison
        const assemblyDataPath = path.join(
          __dirname,
          '..',
          '..',
          'form20',
          state.code.toLowerCase(),
          year.trim(),
          'assembly.json'
        );

        if (fs.existsSync(assemblyDataPath)) {
          const fileContent = fs.readFileSync(assemblyDataPath, 'utf8');
          const assemblyData: AssemblyData[] = JSON.parse(fileContent);

          let filteredData = assemblyData;

          // Filter by constituency if specified
          if (constituency) {
            filteredData = assemblyData.filter((ad) =>
              ad.Constituency.toLowerCase().includes(
                (constituency as string).toLowerCase()
              )
            );
          }

          comparisonData[year] = filteredData.map((ad) => ({
            constituency: ad.Constituency,
            latitude: ad.Latitude,
            longitude: ad.Longitude,
            totalVotes: ad.Total_Votes_Constituency,
            notaVotes: ad.NOTA_Votes_Constituency,
            partyVotes: ad.Party_Votes_Assembly_Aggregated,
            year,
          }));
        }
      } catch (error) {
        console.log(`Assembly data not found for year ${year}`);
      }
    }

    res.json({
      success: true,
      data: {
        state: {
          id: stateId,
          name: state.name,
          code: state.code,
        },
        yearlyComparison: comparisonData,
        years: yearsList,
      },
    });
  } catch (error) {
    console.error('Error fetching election comparison:', error);
    res.status(500).json({
      error: 'Failed to fetch election comparison data',
      details: error,
    });
  }
};

// Get map statistics and analytics
export const getMapStatistics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { stateId, year = '2024' } = req.query;

    // Get basic statistics from database
    const [totalStates, totalConstituencies, totalDistricts] =
      await Promise.all([
        prisma.state.count(),
        stateId
          ? prisma.constituency.count({ where: { stateId: stateId as string } })
          : prisma.constituency.count(),
        stateId
          ? prisma.district.count({ where: { stateId: stateId as string } })
          : prisma.district.count(),
      ]);

    let electionStats: {
      totalConstituencies: number;
      totalVotes: number;
      totalNotaVotes: number;
      partyWiseVotes: Record<string, number>;
      year: string | string[];
    } | null = null;

    // If state is specified, get election statistics
    if (stateId) {
      try {
        const state = await prisma.state.findUnique({
          where: { id: stateId as string },
          select: { code: true, name: true },
        });

        if (state) {
          const assemblyDataPath = path.join(
            __dirname,
            '..',
            '..',
            'form20',
            state.code.toLowerCase(),
            year as string,
            'assembly.json'
          );

          if (fs.existsSync(assemblyDataPath)) {
            const fileContent = fs.readFileSync(assemblyDataPath, 'utf8');
            const assemblyData: AssemblyData[] = JSON.parse(fileContent);

            const totalVotes = assemblyData.reduce(
              (sum, ad) => sum + ad.Total_Votes_Constituency,
              0
            );
            const totalNotaVotes = assemblyData.reduce(
              (sum, ad) => sum + ad.NOTA_Votes_Constituency,
              0
            );

            // Calculate party-wise statistics
            const partyStats: Record<string, number> = {};
            assemblyData.forEach((ad) => {
              Object.entries(ad.Party_Votes_Assembly_Aggregated).forEach(
                ([party, votes]) => {
                  partyStats[party] = (partyStats[party] || 0) + votes;
                }
              );
            });

            electionStats = {
              totalConstituencies: assemblyData.length,
              totalVotes,
              totalNotaVotes,
              partyWiseVotes: partyStats,
              year: Array.isArray(year)
                ? year.map((y) => (typeof y === 'string' ? y : String(y)))
                : typeof year === 'string'
                  ? year
                  : String(year),
            };
          }
        }
      } catch (error) {
        console.log('Election statistics not available');
      }
    }

    res.json({
      success: true,
      data: {
        mapStatistics: {
          totalStates,
          totalConstituencies,
          totalDistricts,
        },
        electionStatistics: electionStats,
      },
    });
  } catch (error) {
    console.error('Error fetching map statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch map statistics',
      details: error,
    });
  }
};

// Get all Rajya Sabha data for UK
// export const getRajyaSabhaData = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const filePath = path.join(
//       __dirname,
//       '..',
//       '..',
//       'form20',
//       'uk',
//       'rajyasabha.json'
//     );
//     if (!fs.existsSync(filePath)) {
//       res
//         .status(404)
//         .json({ success: false, error: 'Rajya Sabha data not found' });
//       return;
//     }
//     const fileContent = fs.readFileSync(filePath, 'utf8');
//     const data = JSON.parse(fileContent);
//     res.json({ success: true, data });
//   } catch (error) {
//     console.error('Error fetching Rajya Sabha data:', error);
//     res
//       .status(500)
//       .json({
//         success: false,
//         error: 'Failed to fetch Rajya Sabha data',
//         details: error,
//       });
//   }
// };

// Get all Vidhan Sabha data for UK
export const getVidhanSabhaData = async (req: Request, res: Response): Promise<void> => {
  try {
    const filePath = path.join(
      __dirname,
      '..',
      '..',
      'form20',
      'uk',
      '2022',
      'vidhanSabha.json'
    );
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'Vidhan Sabha data not found' });
      return;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching Vidhan Sabha data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Vidhan Sabha data',
      details: error,
    });
  }
};
